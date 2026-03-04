import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { calculateCartState } from "@/cart/calculate"
import type { CartState, CartItem } from "@/cart/types"
import type { Env } from "@/types/env"
import { v7 as uuidv7 } from "uuid"

import { eq, and } from "drizzle-orm"
import { members, promotions, levelsTiers } from "@loyalty/db/schema"

export const cartRoute = new Hono<Env>()

/**
 * Core utility to get or initialize a cart session using Cloudflare KV.
 */
async function getOrInitCart(request: Request, env: Env["Bindings"]): Promise<CartState> {
    const cartId = request.headers.get("x-cart-id")
    let cart: CartState | null = null

    if (cartId) {
        const stored = await env.KV_POS_CART.get(cartId)
        if (stored) {
            try {
                cart = JSON.parse(stored) as CartState
            } catch (e) {
                // In case of parsing error, fallback to creating a new cart
            }
        }
    }

    if (!cart) {
        // Either no x-cart-id header provided, or the previously stored cart expired (null from KV)
        const newCartId = uuidv7()
        cart = {
            cartId: newCartId,
            items: [],
            enteredPromoCodes: [],
            appliedPromos: [],
            rejectedPromos: [],
            totals: {
                subtotal: 0,
                discountTotal: 0,
                finalTotal: 0
            }
        }
    }

    return cart!
}

/**
 * GET /api/cart
 * Fetches the current cart state or initializes a new one.
 */
cartRoute.get("/", async (c) => {
    try {
        const cart = await getOrInitCart(c.req.raw, c.env)
        return c.json({ ok: true, data: cart })
    } catch (err: any) {
        console.error("[GET /cart] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * POST /api/cart/member
 * Updates the cart's associated member and fetches their level.
 */
cartRoute.post("/member", async (c) => {
    try {
        const body = await c.req.json()
        const { memberId } = body

        if (!memberId) {
            return c.json({ ok: false, error: "Missing memberId" }, 400)
        }

        const db = getDb(c.env)

        // Fetch member from DB to get their levelId, name, phone, points
        const [member] = await db.select({
            levelId: members.levelId,
            levelName: levelsTiers.name,
            firstName: members.firstName,
            lastName: members.lastName,
            phone: members.phone,
            pointsBalance: members.pointsBalance
        })
            .from(members)
            .leftJoin(levelsTiers, eq(members.levelId, levelsTiers.levelId))
            .where(eq(members.memberId, memberId))

        if (!member) {
            return c.json({ ok: false, error: "Member not found" }, 404)
        }

        const cart = await getOrInitCart(c.req.raw, c.env)

        cart.member = {
            memberId: memberId,
            name: `${member.firstName} ${member.lastName}`.trim(),
            phone: member.phone || "",
            pointsBalance: member.pointsBalance || 0,
        }

        if (member.levelId !== null && member.levelId !== undefined) {
            cart.member.levelId = member.levelId
            cart.member.levelName = member.levelName || undefined
        }

        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[POST /cart/member] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * DELETE /api/cart/member
 * Removes the currently associated member and their level from the cart.
 */
cartRoute.delete("/member", async (c) => {
    try {
        const cart = await getOrInitCart(c.req.raw, c.env)

        if (!cart.member?.memberId) {
            return c.json({ ok: true, data: cart }) // Already no member
        }

        // Remove member object entirely
        delete cart.member

        const db = getDb(c.env)
        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[DELETE /cart/member] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * POST /api/cart/items
 * Adds a new item or increments existing item quantity.
 */
cartRoute.post("/items", async (c) => {
    try {
        const body = await c.req.json()
        const { id, entityId: bodyEntityId, type, quantity } = body
        const entityId = bodyEntityId || id;

        if (!entityId || !type) {
            return c.json({ ok: false, error: "Missing entityId/id or type" }, 400)
        }

        const qtyToAdd = quantity !== undefined ? quantity : 1;

        const cart = await getOrInitCart(c.req.raw, c.env)

        const existingItem = cart.items.find((item: CartItem) => item.entityId === entityId)
        if (existingItem) {
            existingItem.quantity += qtyToAdd
        } else {
            cart.items.push({
                id: uuidv7(),
                entityId,
                type,
                quantity: qtyToAdd,
                unitPrice: 0,
                lineTotal: 0,
                discountAmount: 0,
                finalPrice: 0
            })
        }

        const db = getDb(c.env)
        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[POST /cart/items] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * PUT /api/cart/items/:itemId
 * Updates the quantity of a specific cart item.
 */
cartRoute.put("/items/:itemId", async (c) => {
    try {
        const itemId = c.req.param("itemId")
        const body = await c.req.json()
        const { quantity } = body

        if (quantity === undefined || quantity < 0) {
            return c.json({ ok: false, error: "Invalid quantity" }, 400)
        }

        const cart = await getOrInitCart(c.req.raw, c.env)

        const item = cart.items.find((i: CartItem) => i.id === itemId)
        if (!item) {
            return c.json({ ok: false, error: "Item not found in cart" }, 404)
        }

        if (quantity === 0) {
            cart.items = cart.items.filter((i: CartItem) => i.id !== itemId)
        } else {
            item.quantity = quantity
        }

        const db = getDb(c.env)
        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[PUT /cart/items/:itemId] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * DELETE /api/cart/items/:itemId
 * Removes an item completely from the cart.
 */
cartRoute.delete("/items/:itemId", async (c) => {
    try {
        const itemId = c.req.param("itemId")
        const cart = await getOrInitCart(c.req.raw, c.env)

        cart.items = cart.items.filter((item: CartItem) => item.id !== itemId)

        const db = getDb(c.env)
        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[DELETE /cart/items/:itemId] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * POST /api/cart/promos
 * Appends a promo code to the cart's applied promos.
 */
cartRoute.post("/promos", async (c) => {
    try {
        const body = await c.req.json()
        const { code, promoId } = body

        if (!code && !promoId) {
            return c.json({ ok: false, error: "Missing code or promoId" }, 400)
        }

        const cart = await getOrInitCart(c.req.raw, c.env)
        const db = getDb(c.env)

        // Validate promo code existence and active status
        let promo;
        if (code) {
            [promo] = await db.select({ promoId: promotions.promoId, name: promotions.name, code: promotions.code })
                .from(promotions)
                .where(
                    and(
                        eq(promotions.code, code),
                        eq(promotions.active, true)
                    )
                )
        } else if (promoId) {
            [promo] = await db.select({ promoId: promotions.promoId, name: promotions.name, code: promotions.code })
                .from(promotions)
                .where(
                    and(
                        eq(promotions.promoId, promoId),
                        eq(promotions.active, true)
                    )
                )
        }

        if (!promo) {
            return c.json({ ok: false, error: "Invalid promo code" }, 400)
        }

        if (promo.code && !cart.enteredPromoCodes?.includes(promo.code)) {
            cart.enteredPromoCodes = cart.enteredPromoCodes || []
            cart.enteredPromoCodes.push(promo.code)
        }

        // Remove from rejected array if it exists there
        cart.rejectedPromos = cart.rejectedPromos.filter(p => p.id !== promo.promoId)

        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[POST /cart/promos] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * DELETE /api/cart/promos/:promoId
 * Rejects a promo to ensure it does not automatically get applied again.
 */
cartRoute.delete("/promos/:promoId", async (c) => {
    try {
        const promoId = c.req.param("promoId")
        const cart = await getOrInitCart(c.req.raw, c.env)
        const db = getDb(c.env)

        const [promo] = await db.select({ code: promotions.code, name: promotions.name }).from(promotions).where(eq(promotions.promoId, promoId))

        if (!cart.rejectedPromos.find(p => p.id === promoId)) {
            if (promo) {
                cart.rejectedPromos.push({ id: promoId, name: promo.name })
            } else {
                cart.rejectedPromos.push({ id: promoId, name: promoId })
            }
        }

        if (promo && promo.code && cart.enteredPromoCodes) {
            cart.enteredPromoCodes = cart.enteredPromoCodes.filter(c => c !== promo.code)
        }

        cart.appliedPromos = cart.appliedPromos.filter(p => p.id !== promoId)

        const updatedCart = await calculateCartState(cart, db)

        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[DELETE /cart/promos/:promoId] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * DELETE /api/cart
 * Flushes the current cart out of Cloudflare KV manually.
 */
cartRoute.delete("/", async (c) => {
    try {
        const cartId = c.req.header("x-cart-id")
        if (cartId) {
            await c.env.KV_POS_CART.delete(cartId)
        }
        return c.json({ ok: true, message: "Cart deleted successfully" })
    } catch (err: any) {
        console.error("[DELETE /cart] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * POST /api/cart/recalculate
 * Forces a manual recalculation of the cart state (live prices, promotions) and saves it.
 */
cartRoute.post("/recalculate", async (c) => {
    try {
        const cart = await getOrInitCart(c.req.raw, c.env)
        const db = getDb(c.env)

        const updatedCart = await calculateCartState(cart, db)
        await c.env.KV_POS_CART.put(updatedCart.cartId, JSON.stringify(updatedCart), { expirationTtl: 3600 })

        return c.json({ ok: true, data: updatedCart })
    } catch (err: any) {
        console.error("[POST /cart/recalculate] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})
