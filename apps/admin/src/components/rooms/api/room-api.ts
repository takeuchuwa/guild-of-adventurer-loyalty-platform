import type { Room } from "../types/room"
import type { RoomFormData } from "../types/validations/room-validation"

const API_BASE_URL = import.meta.env.VITE_BE_HOST || "http://192.168.50.108:8787"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

interface FetchRoomsParams {
    pagination: CursorParams
    sorting: Array<{ id: string; desc: boolean }>
    currentSearch?: string
}

export async function fetchRooms({ pagination, sorting, currentSearch }: FetchRoomsParams) {
    const params = new URLSearchParams({
        pageSize: pagination.pageSize.toString(),
    })

    if (pagination.cursor) {
        params.append("cursor", pagination.cursor)
    }

    if (pagination.includeCount) {
        params.append("includeCount", "true")
    }

    if (currentSearch) {
        params.append("q", currentSearch)
    }

    if (sorting.length > 0) {
        const sort = sorting[0]
        params.append("sort", `${sort.id},${sort.desc ? "desc" : "asc"}`)
    }

    const response = await fetch(`${API_BASE_URL}/rooms?${params}`)

    if (!response.ok) {
        throw new Error("Failed to fetch rooms")
    }

    const result = await response.json()
    return {
        rooms: result.data as Room[],
        pagination: result.pagination as { pageSize: number; hasNextPage: boolean; nextCursor: string | null; total?: number },
    }
}

export async function getRoomById(id: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`)

    if (!response.ok) {
        throw new Error("Failed to fetch room")
    }

    const result = await response.json()
    return result.data || result
}

export async function createRoom(data: RoomFormData): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create room")
    }

    return response.json()
}

export async function updateRoom(id: string, data: RoomFormData): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update room")
    }

    return response.json()
}

export async function deleteRoom(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
        method: "DELETE",
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete room")
    }
}
