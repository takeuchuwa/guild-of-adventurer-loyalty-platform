export interface Member {
    memberId: string
    firstName: string | null
    lastName: string | null
    phone: string
    telegramUserId?: string | null
    joinedAt: number
    pointsBalance: number
    levelId: string
    levelsVersion: number
    updatedAt: number
    referredBy?: string | null
    referredByMember?: {
        memberId: string | null
        firstName: string | null
        lastName: string | null
    } | null
}
