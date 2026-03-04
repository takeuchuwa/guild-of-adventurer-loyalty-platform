import type { PaginationState, SortingState } from "@tanstack/react-table"
import type { Promotion } from "@/components/promotions/types/promotion.ts"
import { axiosInstance } from "@/lib/api-utils.ts"
import { AxiosError } from "axios"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchPromotionsOptions {
    pagination: CursorParams
    sorting: SortingState
    currentSearch?: string
    filterParams?: Record<string, any>
}

export interface ApiPagination {
    pageSize: number
    nextCursor: string | null
    hasNextPage: boolean
    total?: number
}

export interface FetchPromotionsResponse {
    promotions: Promotion[]
    pagination: ApiPagination
}

export interface CreatePromotionRequest {
    name: string
    mode: "COUPON" | "AUTO"
    code?: string | null
    description?: string
    active?: boolean
    combinable?: boolean
    priority?: number
    startDate: number
    endDate: number
    usageRemaining?: number | null
    config: any
}

export interface UpdatePromotionRequest {
    name?: string
    mode?: "COUPON" | "AUTO"
    code?: string | null
    description?: string
    active?: boolean
    combinable?: boolean
    priority?: number
    startDate?: number
    endDate?: number
    usageRemaining?: number | null
    config?: any
}

export async function fetchPromotions({
    pagination,
    sorting,
    currentSearch,
    filterParams = {},
}: FetchPromotionsOptions): Promise<FetchPromotionsResponse> {
    try {
        const response = await axiosInstance.get("/promotions", {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
                ...(currentSearch && { q: currentSearch }),
                ...filterParams,
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            promotions: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching promotions:", error)
        return {
            promotions: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function getPromotionById(promoId: string): Promise<Promotion> {
    try {
        const response = await axiosInstance.get(`/promotions/${promoId}`)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to fetch promotion")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        console.error("Error fetching promotion:", error)
        throw new Error("Не вдалося завантажити промоакцію")
    }
}

export async function createPromotion(data: CreatePromotionRequest): Promise<Promotion> {
    try {
        const response = await axiosInstance.post("/promotions", data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to create promotion")
            }
            return response.data.data
        }

        return response.data
    } catch (error: any) {
        console.error("[v0] Create promotion error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при створенні промоакції")
        }

        throw error
    }
}

export async function updatePromotion(promoId: string, data: UpdatePromotionRequest): Promise<Promotion> {
    try {
        const response = await axiosInstance.put(`/promotions/${promoId}`, data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to update promotion")
            }
            return response.data.data
        }

        return response.data
    } catch (error: any) {
        console.error("[v0] Update promotion error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при оновленні промоакції")
        }

        throw error
    }
}

export async function deletePromotion(promoId: string): Promise<void> {
    try {
        const response = await axiosInstance.delete(`/promotions/${promoId}`)

        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при видаленні промоакції")
            }
        }
    } catch (error: any) {
        console.error("[v0] Delete promotion error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при видаленні промоакції")
        }

        throw error
    }
}
