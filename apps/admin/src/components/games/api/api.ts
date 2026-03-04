import type { SortingState } from "@tanstack/react-table"
import type { Game } from "@/components/games/types/game.tsx"

import { axiosInstance } from "@/lib/api-utils.ts"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchGamesOptions {
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

export interface FetchGamesResponse {
    games: Game[]
    pagination: ApiPagination
}

export async function fetchGames({
    pagination,
    sorting,
    currentSearch,
}: FetchGamesOptions): Promise<FetchGamesResponse> {
    try {
        const response = await axiosInstance.get("/games", {
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
            games: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching games:", error)
        return {
            games: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function createGame(data: { name: string; description?: string }): Promise<Game> {
    try {
        const response = await axiosInstance.post("/games", data)

        console.log("[v0] Create game response:", response)

        // Check for 409 conflict
        if (response.status === 409) {
            throw new Error("Гра з такою назвою вже існує")
        }

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при створенні гри")
            }
            return response.data.data
        }

        // Direct response format
        return response.data
    } catch (error: any) {
        console.error("[v0] Create game error:", error)

        // Handle axios errors
        if (error.response) {
            if (error.response.status === 409) {
                throw new Error("Гра з такою назвою вже існує")
            }
            throw new Error(error.response.data?.error || "Помилка при створенні гри")
        }

        throw error
    }
}

export async function updateGame(gameId: string, data: { name: string; description?: string }): Promise<Game> {
    try {
        const response = await axiosInstance.put(`/games/${gameId}`, data)

        console.log("[v0] Update game response:", response)

        // Check for 409 conflict
        if (response.status === 409) {
            throw new Error("Гра з такою назвою вже існує")
        }

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при оновленні гри")
            }
            return response.data.data
        }

        // Direct response format
        return response.data
    } catch (error: any) {
        console.error("[v0] Update game error:", error)

        // Handle axios errors
        if (error.response) {
            if (error.response.status === 409) {
                throw new Error("Гра з такою назвою вже існує")
            }
            throw new Error(error.response.data?.error || "Помилка при оновленні гри")
        }

        throw error
    }
}

export async function getGameById(gameId: string): Promise<Game> {
    try {
        const response = await axiosInstance.get(`/games/${gameId}`)

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error("Систему не знайдено")
            }
            return response.data.data
        }

        // Direct response format
        return response.data
    } catch (error) {
        console.error("Error fetching game:", error)
        throw new Error("Не вдалося завантажити систему")
    }
}

export async function deleteGame(gameId: string): Promise<void> {
    try {
        const response = await axiosInstance.delete(`/games/${gameId}`)

        // Check for 409 conflict
        if (response.status === 409) {
            throw new Error("Не можна видалити систему, яка використовується")
        }

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при видаленні гри")
            }
        }
    } catch (error: any) {
        console.error("[v0] Delete game error:", error)

        // Handle axios errors
        if (error.response) {
            if (error.response.status === 409) {
                throw new Error("Не можна видалити систему, яка використовується")
            }
            throw new Error(error.response.data?.error || "Помилка при видаленні гри")
        }

        throw error
    }
}
