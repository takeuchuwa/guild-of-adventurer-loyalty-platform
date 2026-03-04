export interface Promotion {
    promoId: string
    name: string
    code: string | null
    mode: "COUPON" | "AUTO"
    description: string | null
    active: boolean
    combinable: boolean
    priority: number
    startDate: number
    endDate: number
    usageRemaining: number | null
    config: any
    createdAt: number
    updatedAt: number
}
