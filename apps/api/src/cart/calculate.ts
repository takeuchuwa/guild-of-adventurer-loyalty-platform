import { inArray, eq, or, and, isNull, lte, gte } from "drizzle-orm"
import { activities, products, promotions, promotionAssignments, levelPromotions, entityCategories, games, members } from "@loyalty/db/schema"
import type { CartState, CartItem } from "./types"

/**
 * Main calculation engine for the cart. 
 * Mutates and returns the provided cart object.
 */
export async function calculateCartState(cart: CartState, db: any): Promise<CartState> {
    const itemCategoriesMap = await hydrateItemPricesAndCategories(cart.items, db);

    resetCartPricing(cart);

    let fullMember: any = null;
    if (cart.member?.memberId) {
        const memberRecord = await db.select()
            .from(members)
            .where(eq(members.memberId, cart.member.memberId))
            .limit(1);
        if (memberRecord.length > 0) {
            fullMember = memberRecord[0];
        }
    }

    const eligiblePromos = await fetchEligiblePromotions(cart, db);

    applyPromotionsToCart(cart, eligiblePromos, itemCategoriesMap, fullMember);

    aggregateFinalTotals(cart);

    return cart;
}

/**
 * Step A1: Fetches live prices for activities and products, and updates the cart items.
 * Also fetches category mappings for later promotion targeting.
 */
async function hydrateItemPricesAndCategories(items: CartItem[], db: any): Promise<Map<string, string[]>> {
    const activityIds = items.filter(i => i.type === "activity").map(i => i.entityId);
    const productIds = items.filter(i => i.type === "product").map(i => i.entityId);
    const allItemIds = items.map(i => i.entityId);

    const [liveActivities, liveProducts, itemCategoriesData] = await Promise.all([
        activityIds.length > 0
            ? db.select({
                id: activities.activityId,
                price: activities.price,
                name: activities.name,
                gameId: activities.gameId,
                gameName: games.name,
                overridePoints: activities.overridePoints
            }).from(activities)
                .leftJoin(games, eq(activities.gameId, games.gameId))
                .where(inArray(activities.activityId, activityIds))
            : Promise.resolve([]),
        productIds.length > 0
            ? db.select({
                id: products.productId,
                price: products.price,
                name: products.name,
                overridePoints: products.overridePoints
            }).from(products).where(inArray(products.productId, productIds))
            : Promise.resolve([]),
        allItemIds.length > 0
            ? db.select({ entityId: entityCategories.entityId, categoryId: entityCategories.categoryId }).from(entityCategories).where(inArray(entityCategories.entityId, allItemIds))
            : Promise.resolve([])
    ]);

    const activityPriceMap = new Map(liveActivities.map((a: any) => [a.id, a]));
    const productPriceMap = new Map(liveProducts.map((p: any) => [p.id, p]));

    items.forEach(item => {
        const liveData: any = item.type === "activity" ? activityPriceMap.get(item.entityId) : productPriceMap.get(item.entityId);
        if (liveData !== undefined && liveData !== null) {
            item.unitPrice = liveData.price;
            item.name = liveData.name;
            if (item.type === "activity" && liveData.gameId) {
                item.game = { gameId: liveData.gameId, name: liveData.gameName || "Гра" };
            }

            // Calculate base expected points
            let pointsPerUnit = 0;
            if (liveData.overridePoints !== null && liveData.overridePoints !== undefined && liveData.overridePoints > 0) {
                pointsPerUnit = liveData.overridePoints;
            } else {
                pointsPerUnit = Math.floor(item.unitPrice * 0.1);
            }
            item.pointsEarned = pointsPerUnit * item.quantity;
        }
    });

    const itemCategoriesMap = new Map<string, string[]>();
    for (const row of itemCategoriesData) {
        const arr = itemCategoriesMap.get(row.entityId) || [];
        arr.push(row.categoryId);
        itemCategoriesMap.set(row.entityId, arr);
    }

    return itemCategoriesMap;
}

/**
 * Step A2: Resets line totals and previously applied discounts.
 */
function resetCartPricing(cart: CartState) {
    cart.items.forEach(item => {
        item.lineTotal = item.unitPrice * item.quantity;
        item.discountAmount = 0;
        item.finalPrice = item.lineTotal;
    });

    cart.totals = {
        subtotal: cart.items.reduce((sum, item) => sum + item.lineTotal, 0),
        discountTotal: 0,
        finalTotal: 0
    };

    cart.appliedPromos = [];
}

/**
 * Step B: Queries the database for all available global, member, and level promotions.
 * Sorts them by priority descending.
 */
async function fetchEligiblePromotions(cart: CartState, db: any): Promise<any[]> {
    const now = Math.floor(Date.now() / 1000);

    const baseCondition = and(
        eq(promotions.active, true),
        or(eq(promotions.startDate, -1), lte(promotions.startDate, now)),
        or(eq(promotions.endDate, -1), gte(promotions.endDate, now)),
        or(isNull(promotions.usageRemaining), gte(promotions.usageRemaining, 1))
    );

    const rawAutoPromos = await db.select({ promo: promotions }).from(promotions)
        .leftJoin(promotionAssignments, eq(promotions.promoId, promotionAssignments.promoId))
        .leftJoin(levelPromotions, eq(promotions.promoId, levelPromotions.promoId))
        .where(
            and(
                eq(promotions.mode, "AUTO"),
                isNull(promotionAssignments.promoId),
                isNull(levelPromotions.promoId),
                baseCondition
            )
        );
    let autoPromos = rawAutoPromos.map((row: any) => row.promo);

    let memberPromos: any[] = [];
    if (cart.member?.memberId) {
        const memberAssignments = await db.select({ promo: promotions }).from(promotionAssignments)
            .innerJoin(promotions, eq(promotions.promoId, promotionAssignments.promoId))
            .where(
                and(
                    eq(promotionAssignments.memberId, cart.member.memberId),
                    eq(promotionAssignments.status, "AVAILABLE"),
                    baseCondition
                )
            );
        memberPromos = memberAssignments.map((row: any) => row.promo);
    }

    let levelPromos: any[] = [];
    if (cart.member?.levelId) {
        const levelAssignments = await db.select({ promo: promotions }).from(levelPromotions)
            .innerJoin(promotions, eq(promotions.promoId, levelPromotions.promoId))
            .where(
                and(
                    eq(levelPromotions.levelId, cart.member.levelId),
                    baseCondition
                )
            );
        levelPromos = levelAssignments.map((row: any) => row.promo);
    }

    let enteredPromos: any[] = [];
    if (cart.enteredPromoCodes && cart.enteredPromoCodes.length > 0) {
        const rawEnteredPromos = await db.select({ promo: promotions }).from(promotions)
            .where(
                and(
                    inArray(promotions.code, cart.enteredPromoCodes),
                    baseCondition
                )
            );
        enteredPromos = rawEnteredPromos.map((row: any) => row.promo);
    }

    const allPromos = [...autoPromos, ...memberPromos, ...levelPromos, ...enteredPromos];
    const promoMap = new Map();
    const rejectedIds = cart.rejectedPromos?.map(p => p.id) || [];
    for (const p of allPromos) {
        if (!promoMap.has(p.promoId) && (!rejectedIds.includes(p.promoId))) {
            promoMap.set(p.promoId, p);
        }
    }

    const eligiblePromos = Array.from(promoMap.values());
    eligiblePromos.sort((a, b) => a.priority - b.priority);

    return eligiblePromos;
}

function evaluateItemConditions(
    items: CartItem[],
    itemConditions: any,
    itemCategoriesMap: Map<string, string[]>
): boolean {
    for (const [key, rule] of Object.entries(itemConditions)) {
        if (!rule) continue;
        const { mode, logic, values } = rule as any;
        if (!values || !Array.isArray(values) || values.length === 0) continue;

        let conditionPassed = false;

        if (key === "contains_product") {
            const cartProductIds = items.filter(i => i.type === "product").map(i => i.entityId);
            conditionPassed = evaluateLogic(cartProductIds, values, logic, mode);
        } else if (key === "contains_activity") {
            const cartActivityIds = items.filter(i => i.type === "activity").map(i => i.entityId);
            conditionPassed = evaluateLogic(cartActivityIds, values, logic, mode);
        } else if (key === "contains_category") {
            const cartCategoryIds = new Set<string>();
            for (const item of items) {
                const itemCats = itemCategoriesMap.get(item.entityId) || [];
                for (const c of itemCats) cartCategoryIds.add(c);
            }
            conditionPassed = evaluateLogic(Array.from(cartCategoryIds), values, logic, mode);
        } else {
            conditionPassed = true;
        }

        if (!conditionPassed) return false;
    }
    return true;
}

function evaluateLogic(cartValues: string[], ruleValues: string[], logic: string, mode: string): boolean {
    let result = false;
    if (logic === "all") {
        result = ruleValues.every(val => cartValues.includes(val));
    } else {
        result = ruleValues.some(val => cartValues.includes(val));
    }

    if (mode === "exclude") {
        return !result;
    }
    return result;
}

/**
 * Step C: Iterates sorted promotions and applies them to eligible cart items.
 */
function applyPromotionsToCart(cart: CartState, eligiblePromos: any[], itemCategoriesMap: Map<string, string[]>, fullMember: any) {
    const newlyAppliedPromos: { id: string, name: string, bonusPoints?: number }[] = [];
    let nonCombinableApplied = false;

    for (const promo of eligiblePromos) {
        // If we've already applied a non-combinable promo, we can only apply combinable ones
        if (nonCombinableApplied && !promo.combinable) {
            continue;
        }

        let config: any;
        try {
            config = typeof promo.config === 'string' ? JSON.parse(promo.config) : promo.config;
        } catch {
            continue;
        }

        if (config.conditions?.cartConditions?.cart_total) {
            if (cart.totals.subtotal < config.conditions.cartConditions.cart_total) {
                continue;
            }
        }

        if (config.conditions?.cartConditions?.cart_item_count) {
            const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
            if (totalItems < config.conditions.cartConditions.cart_item_count) {
                continue;
            }
        }

        if (config.conditions?.memberConditions?.member_is_new !== undefined) {
            if (!cart.member?.memberId || !fullMember) {
                continue;
            }
            const daysLimit = config.conditions.memberConditions.member_is_new;
            const nowSeconds = Math.floor(Date.now() / 1000);
            const daysSinceJoin = (nowSeconds - fullMember.joinedAt) / (60 * 60 * 24);
            if (daysSinceJoin > daysLimit) continue;
        }

        if (config.conditions?.itemConditions) {
            const passed = evaluateItemConditions(cart.items, config.conditions.itemConditions, itemCategoriesMap);
            if (!passed) continue;
        }

        let appliedToAnyItem = false;
        let promoBonusPoints = 0;

        for (const item of cart.items) {
            const itemCategories = itemCategoriesMap.get(item.entityId) || [];

            if (!isItemEligibleForPromo(item, itemCategories, config)) {
                continue;
            }

            const discount = calculateItemDiscount(item, config.effects?.price);
            if (discount > 0) {
                item.discountAmount += discount;
                item.finalPrice -= discount;
                appliedToAnyItem = true;
            }
        }

        if (config.effects?.points) {
            const pointsEffect = config.effects.points;

            if (pointsEffect.type === "bonus") {
                promoBonusPoints = typeof pointsEffect.value === "number" ? pointsEffect.value : 0;
                if (promoBonusPoints > 0) {
                    appliedToAnyItem = true;
                }
            } else if (pointsEffect.type === "multiplier") {
                for (const item of cart.items) {
                    const itemCategories = itemCategoriesMap.get(item.entityId) || [];
                    if (!isItemEligibleForPromo(item, itemCategories, config)) {
                        continue;
                    }
                    if (item.pointsEarned && item.pointsEarned > 0) {
                        const multiplier = typeof pointsEffect.value === "number" ? pointsEffect.value : 1;
                        if (multiplier > 1) {
                            const extraPoints = Math.floor(item.pointsEarned * (multiplier - 1));
                            promoBonusPoints += extraPoints;
                            appliedToAnyItem = true;
                        }
                    }
                }
            }
        }

        if (appliedToAnyItem) {
            const promoState: { id: string, name: string, bonusPoints?: number } = { id: promo.promoId, name: promo.name };
            if (promoBonusPoints > 0) {
                promoState.bonusPoints = promoBonusPoints;
            }
            newlyAppliedPromos.push(promoState);

            if (!promo.combinable) {
                nonCombinableApplied = true;
            }
        }
    }

    cart.appliedPromos = newlyAppliedPromos;
}

/**
 * Evaluates filters and target entities to determine if an item is eligible for a given promo.
 */
function isItemEligibleForPromo(item: CartItem, itemCategories: string[], config: any): boolean {
    const filters = config.filter || {};
    if (item.type === "product" && filters.excludeProducts?.includes(item.entityId)) return false;
    if (item.type === "activity" && filters.excludeActivities?.includes(item.entityId)) return false;
    if (filters.excludeCategories?.some((catId: string) => itemCategories.includes(catId))) return false;

    const targets = config.targets || {};
    if (!targets.type || targets.type === "cart") {
        return true;
    }

    if (targets.type === "entity") {
        if (targets.entitySubType === "products" && item.type === "product") {
            if (targets.products?.length > 0) return targets.products.includes(item.entityId);
            if (targets.categories?.length > 0) return targets.categories.some((catId: string) => itemCategories.includes(catId));
            return true;
        }

        if (targets.entitySubType === "sessions" && item.type === "activity") {
            if (item.game?.gameId) return false; // Exclude activities with games
            if (targets.activities?.length > 0) return targets.activities.includes(item.entityId);
            if (targets.categories?.length > 0) return targets.categories.some((catId: string) => itemCategories.includes(catId));
            return true;
        }

        if (targets.entitySubType === "games" && item.type === "activity") {
            if (!item.game?.gameId) return false; // Require gameId
            if (targets.activities?.length > 0) return targets.activities.includes(item.entityId);
            if (targets.categories?.length > 0) return targets.categories.some((catId: string) => itemCategories.includes(catId));
            return true;
        }

        if (targets.entitySubType === "categories") {
            if (targets.categories?.length > 0) return targets.categories.some((catId: string) => itemCategories.includes(catId));
            return true;
        }

        return false;
    }

    if (targets.type === "items") {
        return (targets.products?.includes(item.entityId)) || (targets.activities?.includes(item.entityId)) || false;
    }

    return false;
}

/**
 * Calculates the exact discount amount to apply to an item based on the effect rules.
 */
function calculateItemDiscount(item: CartItem, effect: any): number {
    if (!effect || !effect.value) return 0;

    let discount = 0;
    if (effect.type === "percentage") {
        discount = item.lineTotal * (effect.value / 100);
    } else if (effect.type === "fixed") {
        discount = effect.value;
    }

    if (discount > item.finalPrice) {
        discount = item.finalPrice;
    }

    return discount;
}

/**
 * Step D: Aggregates the final discounted amounts into the cart totals.
 */
function aggregateFinalTotals(cart: CartState) {
    cart.totals.finalTotal = cart.items.reduce((sum, item) => sum + item.finalPrice, 0);
    cart.totals.discountTotal = cart.items.reduce((sum, item) => sum + item.discountAmount, 0);
    cart.totals.pointsExpected = cart.items.reduce((sum, item) => sum + (item.pointsEarned || 0), 0);
    cart.totals.bonusPoints = cart.appliedPromos.reduce((sum, promo) => sum + (promo.bonusPoints || 0), 0);
}
