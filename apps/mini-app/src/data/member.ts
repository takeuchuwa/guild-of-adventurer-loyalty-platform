export interface UnclaimedPrize {
  levelId: string
  levelName: string
  prizesString: string
}

export interface Promotion {
  promoId: string
  name: string
  description: string | null
  promoCode: string | null
  startDate: number
  endDate: number
  config: any
  isPersonal: boolean
}

export interface Member {
  memberId: string
  firstName: string
  lastName: string | null
  nickname?: string | null
  phone: string | null
  pointsBalance: number
  levelId: string
  birthDate: number | null
  referredBy: string | null
  joinedAt: number
  photoUrl?: string | null
  unclaimedPrizes?: UnclaimedPrize[]
  promotions?: Promotion[]
  targetsMap?: Record<string, string>
  statistics?: Record<string, number>
  qrcode: string
}

export const mockMember: Member = {
  memberId: "01964a3b-7c2d-7e1a-8f3b-4c5d6e7f8a9b",
  firstName: "Dmytro",
  lastName: "Horban",
  nickname: null,
  phone: "+380991234567",
  pointsBalance: 670,
  levelId: "C",
  birthDate: 852076800, // 01.01.1997
  referredBy: null,
  joinedAt: 1700000000,
  photoUrl: null,
  unclaimedPrizes: [],
  promotions: [],
  statistics: {},
  qrcode: ""
}
