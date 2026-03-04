export interface Benefit {
    benefitId: string
    levelId: string
    name: string
    description?: string
    createdAt: number
    updatedAt: number
}

export interface Prize {
    prizeId: string
    levelId: string
    name: string
    description?: string
    createdAt: number
    updatedAt: number
}

export interface Level {
    levelId: string
    name: string
    minPoints: number
    discountProducts?: number
    discountActivities?: number
    discountGames?: number
    fixedProducts?: boolean
    fixedActivities?: boolean
    fixedGames?: boolean
    defaultLevel: boolean
    sortOrder: number
    createdAt: number
    updatedAt: number
    benefits?: Benefit[]
    prizes?: Prize[]
}

export interface LevelFormData {
    levelId: string
    name: string
    minPoints: number
    discountProducts?: number
    discountActivities?: number
    discountGames?: number
    fixedProducts?: boolean
    fixedActivities?: boolean
    fixedGames?: boolean
    defaultLevel?: boolean
    sortOrder: number
    benefits?: Array<{ benefitId?: string; name: string; description?: string }>
    prizes?: Array<{ prizeId?: string; name: string; description?: string }>
}
