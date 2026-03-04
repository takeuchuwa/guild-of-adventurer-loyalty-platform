import type { SortingState } from "@tanstack/react-table"
import type { Activity } from "@/components/activities/types/activity.tsx"

import { axiosInstance } from "@/lib/api-utils.ts"
import { AxiosError } from "axios"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchActivitiesOptions {
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

export interface FetchActivitiesResponse {
    activities: Activity[]
    pagination: ApiPagination
}

export interface CreateActivityRequest {
    name: string
    description?: string
    price: number
    overridePoints?: number | null
    startDate: number
    endDate: number
    gameId?: string | null
    systemId?: string | null
    roomId?: string | null
    categoryIds: string[]
}

export interface UpdateActivityRequest {
    name: string
    description?: string
    price: number
    overridePoints?: number | null
    startDate: number
    endDate: number
    gameId?: string | null
    systemId?: string | null
    roomId?: string | null
    categoryIds: string[]
}


export async function fetchActivities({
    pagination,
    sorting,
    currentSearch,
    filterParams = {},
}: FetchActivitiesOptions): Promise<FetchActivitiesResponse> {
    try {
        const response = await axiosInstance.get("/activities", {
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
            activities: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching activities:", error)
        return {
            activities: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function getActivityById(activityId: string): Promise<Activity> {
    try {
        const response = await axiosInstance.get(`/activities/${activityId}`)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to fetch activity")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        console.error("Error fetching activity:", error)
        throw new Error("Не вдалося завантажити активність")
    }
}

export async function createActivity(data: CreateActivityRequest): Promise<Activity> {
    try {
        const response = await axiosInstance.post("/activities", data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to create activity")
            }
            return response.data.data
        }

        return response.data
    } catch (error: any) {
        console.error("[v0] Create activity error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при створенні активності")
        }

        throw error
    }
}

export async function updateActivity(activityId: string, data: UpdateActivityRequest): Promise<Activity> {
    try {
        const response = await axiosInstance.put(`/activities/${activityId}`, data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to update activity")
            }
            return response.data.data
        }

        return response.data
    } catch (error: any) {
        console.error("[v0] Update activity error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при оновленні активності")
        }

        throw error
    }
}

export async function deleteActivity(activityId: string): Promise<void> {
    try {
        const response = await axiosInstance.delete(`/activities/${activityId}`)

        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при видаленні активності")
            }
        }
    } catch (error: any) {
        console.error("[v0] Delete activity error:", error)

        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.error || "Помилка при видаленні активності")
        }

        throw error
    }
}
