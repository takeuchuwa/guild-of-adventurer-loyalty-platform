import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { activities, members, pointsLedger, products, promotions, memberPromotionUsages, entityCategories, categories } from "@loyalty/db/schema"
import { eq, inArray, and, gt } from "drizzle-orm"
import type { Env } from "@/types/env"
import z from "zod"
import { checkAndProcessLevelUp } from "@/utils/level-up"
import { v7 as uuidv7 } from 'uuid';
import { calculateCartState } from "@/cart/calculate";
import type { CartState } from "@/cart/types";
import { sendBatchNotifications } from "@/utils/notify";

const CheckoutBodySchema = z.object({
    expectedTotal: z.number().min(0, "Expected total cannot be negative"),
})

export const checkoutRoute = new Hono<Env>()

/**
 * POST /api/checkout
 * Process checkout: validate KV cart against expected total, apply optimistic locking to promos, 
 * calculate and distribute loyalty points, and flush cart.
 */
checkoutRoute.post("/", async (c) => {
    try {
        const db = getDb(c.env)
        const cartId = c.req.header("x-cart-id")

        // Step 1: Validate KV State
        if (!cartId) {
            return c.json({ ok: false, error: "Missing x-cart-id header" }, 400)
        }

        const storedCart = await c.env.KV_POS_CART.get(cartId)
        if (!storedCart) {
            return c.json({ ok: false, error: "Cart not found or expired" }, 400)
        }

        let cart: CartState
        try {
            cart = JSON.parse(storedCart) as CartState
        } catch (e) {
            return c.json({ ok: false, error: "Invalid cart state in KV" }, 400)
        }

        if (!cart.items || cart.items.length === 0) {
            return c.json({ ok: false, error: "Cart is empty" }, 400)
        }

        const body = await c.req.json()
        const parsed = CheckoutBodySchema.parse(body)

        // Step 2: Live Price & State Guard (Crucial)
        const calculatedCart = await calculateCartState(cart, db)

        // Precision check to avoid float errors
        const diff = Math.abs(calculatedCart.totals.finalTotal - parsed.expectedTotal)
        if (diff > 0.01) {
            return c.json({
                ok: false,
                error: "Cart state changed. Please review the updated totals.",
                data: calculatedCart
            }, 409)
        }

        let batchOps: any[] = []
        let pendingNotifies: Array<{ memberId?: string; kind: string; body: any }> = []

        // Step 3: Optimistic Locking for Promotions
        const appliedPromoIds = (calculatedCart.appliedPromos || []).map(p => p.id)
        const successfullyUpdatedPromos: string[] = []

        if (appliedPromoIds.length > 0) {
            const activePromos = await db.select()
                .from(promotions)
                .where(inArray(promotions.promoId, appliedPromoIds))
                .all()

            const promoMap = new Map(activePromos.map(p => [p.promoId, p]))

            for (const promoId of appliedPromoIds) {
                const promo = promoMap.get(promoId)
                if (!promo) {
                    // Revert already successfully updated promos
                    await rollbackPromotions(db, successfullyUpdatedPromos)
                    return c.json({ ok: false, error: "A promotion applied to your cart is no longer available or just ran out of uses." }, 409)
                }

                if (promo.usageRemaining !== null && promo.usageRemaining !== undefined) {
                    const result = await db.update(promotions)
                        .set({
                            usageRemaining: promo.usageRemaining - 1,
                            version: promo.version + 1
                        })
                        .where(
                            and(
                                eq(promotions.promoId, promoId),
                                eq(promotions.version, promo.version),
                                gt(promotions.usageRemaining, 0)
                            )
                        )
                        .run()

                    // Check rows affected (D1 returns meta object with changes count)
                    if (result.meta && result.meta.changes === 0) {
                        await rollbackPromotions(db, successfullyUpdatedPromos)
                        return c.json({ ok: false, error: "A promotion applied to your cart is no longer available or just ran out of uses." }, 409)
                    }

                    successfullyUpdatedPromos.push(promoId)
                }

                // If promo has max usage per member, we need to track it
                let config: any = {};
                try {
                    config = typeof promo.config === 'string' ? JSON.parse(promo.config) : promo.config;
                } catch { }

                if (config?.conditions?.memberConditions?.max_usage_per_member !== undefined && calculatedCart.member?.memberId) {
                    const now = Math.floor(Date.now() / 1000);
                    batchOps.push(
                        db.insert(memberPromotionUsages)
                            .values({
                                usageId: uuidv7(),
                                memberId: calculatedCart.member.memberId,
                                promoId: promoId,
                                usedAt: now
                            })
                    );
                }
            }
        }

        // Step 4: Loyalty Points Distribution
        const now = Math.floor(Date.now() / 1000)
        let currentBalance = 0;
        let member = null;

        if (calculatedCart.member?.memberId) {
            member = await db.select().from(members).where(eq(members.memberId, calculatedCart.member.memberId)).get()
            if (member) {
                currentBalance = member.pointsBalance
            }
        }

        const ledgerEntries = []

        // Only process points if the member is mapped
        if (member) {
            const productIds = calculatedCart.items.filter((i: any) => i.type === "product").map((i: any) => i.entityId)
            const activityIds = calculatedCart.items.filter((i: any) => i.type === "activity").map((i: any) => i.entityId)

            const fetchedProducts = productIds.length > 0 ? await db.select().from(products).where(inArray(products.productId, productIds)).all() : []
            const fetchedActivities = activityIds.length > 0 ? await db.select().from(activities).where(inArray(activities.activityId, activityIds)).all() : []

            const productMap = new Map(fetchedProducts.map((p) => [p.productId, p]))
            const activityMap = new Map(fetchedActivities.map((a) => [a.activityId, a]))

            const transactionPrefix = `checkout-${cartId}`

            for (let lineIndex = 0; lineIndex < calculatedCart.items.length; lineIndex++) {
                const item = calculatedCart.items[lineIndex]

                if (item.pointsEarned && item.pointsEarned > 0) {
                    currentBalance += item.pointsEarned

                    ledgerEntries.push({
                        entryId: uuidv7(),
                        memberId: member.memberId,
                        occurredAt: now,
                        delta: item.pointsEarned,
                        balanceAfter: currentBalance,
                        productId: item.type === "product" ? item.entityId : null,
                        activityId: item.type === "activity" ? item.entityId : null,
                        promoId: null,
                        adminNote: null,
                        idempotencyKey: `${transactionPrefix}-line-${item.id}`,
                    })
                }
            }

            if (calculatedCart.appliedPromos && calculatedCart.appliedPromos.length > 0) {
                for (const promo of calculatedCart.appliedPromos) {
                    if (promo.bonusPoints && promo.bonusPoints > 0) {
                        currentBalance += promo.bonusPoints;

                        ledgerEntries.push({
                            entryId: uuidv7(),
                            memberId: member.memberId,
                            occurredAt: now,
                            delta: promo.bonusPoints,
                            balanceAfter: currentBalance,
                            productId: null,
                            activityId: null,
                            promoId: promo.id,
                            adminNote: null,
                            idempotencyKey: `${transactionPrefix}-promo-${promo.id}`,
                        });
                    }
                }
            }

            // Process Member Statistics
            const statsUpdates: Record<string, number> = {};
            for (const item of calculatedCart.items) {
                if (item.quantity > 0) {
                    if (!statsUpdates[item.entityId]) statsUpdates[item.entityId] = 0;
                    statsUpdates[item.entityId] += item.quantity;
                }
            }

            const entityIds = Object.keys(statsUpdates);
            if (entityIds.length > 0) {
                const fetchedCategories = await db.select({
                    entityId: entityCategories.entityId,
                    categoryName: categories.name
                })
                .from(entityCategories)
                .innerJoin(categories, eq(entityCategories.categoryId, categories.categoryId))
                .where(inArray(entityCategories.entityId, entityIds))
                .all();

                let memberStatsJson: Record<string, number> = (member.statistics as Record<string, number>) || {};
                
                let hasStatsChanges = false;
                for (const fc of fetchedCategories) {
                    const addedQuantity = statsUpdates[fc.entityId] || 0;
                    if (addedQuantity > 0) {
                        if (!memberStatsJson[fc.categoryName]) memberStatsJson[fc.categoryName] = 0;
                        memberStatsJson[fc.categoryName] += addedQuantity;
                        hasStatsChanges = true;
                    }
                }

                if (hasStatsChanges) {
                    batchOps.push(
                        db.update(members)
                        .set({ statistics: memberStatsJson })
                        .where(eq(members.memberId, member.memberId))
                    );
                }
            }

            if (ledgerEntries.length > 0) {
                batchOps.push(db.insert(pointsLedger).values(ledgerEntries))

                const levelUpResult = await checkAndProcessLevelUp(db, member.memberId, member.pointsBalance, currentBalance, now, "checkout")

                if (levelUpResult.ledgerEntries.length > 0) {
                    batchOps.push(db.insert(pointsLedger).values(levelUpResult.ledgerEntries))
                }
                if (levelUpResult.batchOperations.length > 0) {
                    batchOps.push(...levelUpResult.batchOperations)
                }
                pendingNotifies.push(...levelUpResult.notifications)

                const totalCheckoutPoints = ledgerEntries.reduce((sum, e) => sum + e.delta, 0)
                if (totalCheckoutPoints > 0 && member.telegramUserId) {
                    pendingNotifies.push({
                        memberId: member.memberId,
                        kind: "checkout_points",
                        body: {
                            kind: "checkout_points",
                            telegramUserId: member.telegramUserId,
                            points: totalCheckoutPoints,
                        },
                    })
                }
            }
        }

        // Execute batch DB operations
        if (batchOps.length > 0) {
            try {
                await db.batch(batchOps as any)

                try {
                    // @ts-ignore Cloudflare runtime
                    c.executionCtx?.waitUntil(sendBatchNotifications(db, c.env, pendingNotifies))
                } catch (e) {
                    console.warn("[checkout] notification scheduling failed", e)
                }
            } catch (batchError) {
                // If the batch operation fails, rollback any successfully decremented promos
                await rollbackPromotions(db, successfullyUpdatedPromos)
                throw batchError // Rethrow to be caught by the outer catch block
            }
        }

        // Step 5: Cleanup & Success
        await c.env.KV_POS_CART.delete(cartId)

        return c.json({
            ok: true,
            data: {
                message: "Checkout successful",
                entriesCreated: ledgerEntries.length,
                totalPoints: ledgerEntries.reduce((sum, e) => sum + e.delta, 0),
            },
        })
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return c.json({ ok: false, error: "VALIDATION_ERROR", details: err.issues }, 400)
        }
        console.error("[POST /checkout] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

async function rollbackPromotions(db: any, promoIds: string[]) {
    if (!promoIds || promoIds.length === 0) return;

    // Cloudflare D1 doesn't have a reliable single-query variable increment for lists 
    // unless we loop or run a mapped batch of statements.
    const batchUpdates = promoIds.map(id => {
        return db.run(`UPDATE promotions SET usage_remaining = usage_remaining + 1, version = version - 1 WHERE promo_id = ?`, [id]);
    });

    try {
        await Promise.all(batchUpdates);
    } catch (e) {
        console.error("CRITICAL: Failed to rollback promotion usage counts:", e);
    }
}
