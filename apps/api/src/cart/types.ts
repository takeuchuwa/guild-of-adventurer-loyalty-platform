/**
 * Represents an individual item in the shopping cart.
 */
export interface CartItem {
    /** Unique UUIDv7 for this specific line item in the cart. */
    id: string;

    /** UUID of the product or activity being purchased. */
    entityId: string;

    /** Indicates whether the item is an activity or a physical product. */
    type: "activity" | "product";

    /** The quantity of this item in the cart. */
    quantity: number;

    /** The base price for a single unit, fetched from the DB. */
    unitPrice: number;

    /** Calculated as unitPrice * quantity before discounts. */
    lineTotal: number;

    /** The total currency amount discounted from this specific line item. */
    discountAmount: number;

    /** Calculated as lineTotal - discountAmount. */
    finalPrice: number;

    /** The human-readable name of the product or activity (fetched during calculation). */
    name?: string;

    /** Optional game information attached to an activity. */
    game?: {
        gameId: string;
        name: string;
    } | null;

    /** Total expected points the user will earn for purchasing this item. */
    pointsEarned?: number;
}

export interface PromoState {
    id: string;
    name: string;
    /** Points granted explicitly by this promotion */
    bonusPoints?: number;
}

/**
 * Represents the entire state of a POS checkout cart stored in Cloudflare KV.
 */
export interface CartState {
    /** Unique UUIDv7 identifier for the cart session. */
    cartId: string;

    /** Detailed member information for rendering and calculation. */
    member?: {
        memberId: string;
        name: string;
        phone: string;
        pointsBalance: number;
        levelId?: string;
        levelName?: string;
    };

    /** The list of items currently added to the cart. */
    items: CartItem[];

    /**
     * Array of manually entered promo codes by the user.
     * These are validated during calculation.
     */
    enteredPromoCodes: string[];

    /**
     * Array of promos that are currently applied and actively
     * affecting the final cart discount total.
     */
    appliedPromos: PromoState[];

    /**
     * Array of promos that were explicitly removed or rejected by the admin.
     * Tracking this prevents the backend auto-promo engine from automatically re-applying them
     * during iterative cart updates.
     */
    rejectedPromos: PromoState[];

    /** Computed financial totals for the cart. */
    totals: {
        /** The sum total of all items before any discounts are applied. */
        subtotal: number;

        /** The total amount of discount applied to the cart (from promos, levels, etc.). */
        discountTotal: number;

        /** The final payable amount (subtotal minus discountTotal). */
        finalTotal: number;

        /** Total expected loyalty points to be earned from this transaction. */
        pointsExpected?: number;

        /** Total bonus points granted by promotions. */
        bonusPoints?: number;
    };
}
