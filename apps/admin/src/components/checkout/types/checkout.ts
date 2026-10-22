export interface CartItem {
    id: string;
    entityId: string;
    type: "activity" | "product" | "donation";
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
    inventory?: number;
    donation?: DonationDetails;
}

export interface DonationDetails {
    /** Admin-entered name, without the "Донат: " prefix. */
    label: string;
    pointsPercent: number;
    activityId?: string;
    activityName?: string;
}

export interface DonationPayload {
    label: string;
    amount: number;
    pointsPercent: number;
    activityId?: string | null;
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
