export interface PointsLedgerEntry {
    entryId: string
    memberId: string
    occurredAt: number
    delta: number
    balanceAfter: number
    activityId: string | null
    activityName?: string | null
    productId: string | null
    productName?: string | null
    promoId: string | null
    promoName?: string | null
    adminNote: string | null
    idempotencyKey: string
}
