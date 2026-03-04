export interface CartItem {
    id: string;
    entityId: string;
    type: "activity" | "product";
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountAmount: number;
    finalPrice: number;
    name?: string;
    game?: {
        gameId: string;
        name: string;
    } | null;
    pointsEarned?: number;
}

export interface PromoState {
    id: string;
    name: string;
    bonusPoints?: number;
}

export interface CartState {
    cartId: string;
    member?: {
        memberId: string;
        name: string;
        phone: string;
        pointsBalance: number;
        levelId?: string;
        levelName?: string;
    };
    items: CartItem[];
    enteredPromoCodes?: string[];
    appliedPromos: PromoState[];
    rejectedPromos: PromoState[];
    totals: {
        subtotal: number;
        discountTotal: number;
        finalTotal: number;
        pointsExpected?: number;
        bonusPoints?: number;
    };
}
