import type { Level, LevelFormData } from "../types/level-types"
import type { SortingState } from "@tanstack/react-table"

const API_BASE_URL = import.meta.env.VITE_BE_HOST || "http://192.168.50.108:8787"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export async function fetchLevels(params?: {
    pagination?: CursorParams
    sorting?: SortingState
    currentSearch?: string
}): Promise<{ levels: Level[]; pagination: { hasNextPage: boolean; nextCursor: string | null; pageSize: number; total?: number } }> {
    const searchParams = new URLSearchParams()

    if (params?.pagination) {
        searchParams.set("pageSize", params.pagination.pageSize.toString())
        if (params.pagination.cursor) {
            searchParams.set("cursor", params.pagination.cursor)
        }
        if (params.pagination.includeCount) {
            searchParams.set("includeCount", "true")
        }
    }

    if (params?.currentSearch) {
        searchParams.set("q", params.currentSearch)
    }

    if (params?.sorting && params.sorting.length > 0) {
        const sort = params.sorting[0]
        searchParams.set("sort", `${sort.id},${sort.desc ? "desc" : "asc"}`)
    }

    const response = await fetch(`${API_BASE_URL}/levels?${searchParams}`)
    if (!response.ok) {
        throw new Error("Failed to fetch levels")
    }
    const result = await response.json()

    return {
        levels: result.data || [],
        pagination: result.pagination || { hasNextPage: false, nextCursor: null, pageSize: 10 },
    }
}

export async function fetchLevel(id: string): Promise<Level> {
    const response = await fetch(`${API_BASE_URL}/levels/${id}`)
    if (!response.ok) {
        throw new Error("Failed to fetch level")
    }
    return response.json()
}

export async function createLevel(data: LevelFormData): Promise<Level> {
    const response = await fetch(`${API_BASE_URL}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create level")
    }
    return response.json()
}

export async function updateLevel(id: string, data: LevelFormData): Promise<Level> {
    const response = await fetch(`${API_BASE_URL}/levels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update level")
    }
    return response.json()
}

export async function deleteLevel(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/levels/${id}`, {
        method: "DELETE",
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete level")
    }
}
