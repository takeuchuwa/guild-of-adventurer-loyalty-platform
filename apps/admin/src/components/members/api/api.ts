import type { SortingState } from "@tanstack/react-table"
import type { Member } from "@/components/members/types/member.tsx"
import type { PointsLedgerEntry } from "@/components/members/types/points-ledger.ts"

import { axiosInstance } from "@/lib/api-utils.ts"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchMembersOptions {
    pagination: CursorParams
    sorting: SortingState
    currentSearch?: string
}

export interface ApiPagination {
    pageSize: number
    nextCursor: string | null
    hasNextPage: boolean
    total?: number
}

export interface FetchMembersResponse {
    members: Member[]
    pagination: ApiPagination
}

export async function fetchMembers({
    pagination,
    sorting,
    currentSearch,
}: FetchMembersOptions): Promise<FetchMembersResponse> {
    try {
        console.log(sorting);
        const response = await axiosInstance.get("/members", {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
                ...(currentSearch && { q: currentSearch }),
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            members: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching members:", error)
        return {
            members: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function getMemberById(id: string): Promise<Member> {
    try {
        const response = await axiosInstance.get(`/members/${id}`)
        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }
        return response.data.data
    } catch (error) {
        console.error("Error fetching member:", error)
        throw error
    }
}

export async function updateMember(
    id: string,
    data: { firstName: string | null; lastName: string | null },
): Promise<Member> {
    try {
        const response = await axiosInstance.put(`/members/${id}`, data)
        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }
        return response.data.data
    } catch (error) {
        console.error("Error updating member:", error)
        throw error
    }
}

export async function adjustMemberPoints(id: string, points: number, reason: string): Promise<Member> {
    try {
        const response = await axiosInstance.post(`/members/${id}/adjust-points`, { points, reason })
        if (!response.data.ok) {
            throw new Error(response.data.message || "Server returned ok=false")
        }
        return response.data.data
    } catch (error: any) {
        console.error("Error adjusting member points:", error)
        throw error
    }
}

export interface FetchPointsLedgerOptions {
    memberId: string
    pagination: CursorParams
    sorting: SortingState
}

export interface FetchPointsLedgerResponse {
    entries: PointsLedgerEntry[]
    pagination: ApiPagination
}

export async function fetchPointsLedger({
    memberId,
    pagination,
    sorting,
}: FetchPointsLedgerOptions): Promise<FetchPointsLedgerResponse> {
    try {
        const response = await axiosInstance.get(`/members/${memberId}/points-ledger`, {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            entries: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching points ledger:", error)
        return {
            entries: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

// ---- Loyalty Level Info & Prize Claim ----
export interface LevelInfoResponse {
    member: { memberId: string; levelId: string; firstName: string | null; lastName: string | null; pointsBalance: number }
    level: {
        levelId: string
        name: string
        discountProducts?: number
        discountActivities?: number
        discountGames?: number
        fixedProducts?: boolean
        fixedActivities?: boolean
        fixedGames?: boolean
    }
    benefits: Array<{ name: string | null; description?: string | null }>
    prizes: Array<{ name: string | null; description?: string | null }>
    claim: { claimed: boolean; claimedAt: number | null }
    unclaimedLevelPrizes?: Array<{ levelId: string; levelName: string; prizesString: string }>
}

export async function getMemberLevelInfo(memberId: string): Promise<LevelInfoResponse> {
    const res = await axiosInstance.get(`/members/${memberId}/level-info`)
    if (!res.data.ok) throw new Error(res.data.message || "Failed to load level info")
    return res.data.data
}

export interface ClaimPrizeResponse {
    claimed: boolean
    claimedAt: number
    levelId?: string
}

export async function claimMemberPrize(memberId: string, levelId?: string): Promise<ClaimPrizeResponse> {
    const res = await axiosInstance.post(`/members/${memberId}/claim`, { levelId })
    if (!res.data.ok) throw new Error(res.data.message || "Failed to claim prize")
    return res.data.data
}

export interface FetchUnclaimedPrizesOptions {
    pagination: CursorParams
    sorting: SortingState
    currentSearch?: string
}

export interface UnclaimedPrizeRow {
    memberId: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    levelId: string
    levelName: string
    prizesString: string
}

export interface FetchUnclaimedPrizesResponse {
    entries: UnclaimedPrizeRow[]
    pagination: ApiPagination
}

export async function fetchUnclaimedPrizes({ pagination, sorting, currentSearch }: FetchUnclaimedPrizesOptions): Promise<FetchUnclaimedPrizesResponse> {
    try {
        const response = await axiosInstance.get("/members/unclaimed-prizes", {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
                ...(currentSearch && { q: currentSearch }),
            },
        })
        if (!response.data.ok) throw new Error("Server returned ok=false")
        return {
            entries: response.data.data || [],
            pagination: response.data.pagination || { pageSize: pagination.pageSize, hasNextPage: false, nextCursor: null },
        }
    } catch (error) {
        console.error("Error fetching unclaimed prizes:", error)
        return { entries: [], pagination: { pageSize: pagination.pageSize, hasNextPage: false, nextCursor: null } }
    }
}
