import { axiosInstance } from "@/lib/api-utils"
import type { System } from "@/components/games/systems/types/system"
import axios from "axios"

export async function fetchGameSystems(gameId: string): Promise<System[]> {
    try {
        const response = await axiosInstance.get(`/games/${gameId}/systems`)
        console.log("[v0] fetchGameSystems response:", response.data)

        // Handle both wrapped and direct response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            return response.data.data || []
        }

        return Array.isArray(response.data) ? response.data : []
    } catch (error) {
        console.error("Error fetching game systems:", error)
        throw error
    }
}

export async function createGameSystem(gameId: string, data: { name: string; description?: string }): Promise<System> {
    try {
        const response = await axiosInstance.post(`/games/${gameId}/systems`, data)
        console.log("[v0] createGameSystem response:", response.data)

        // Handle both wrapped and direct response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            throw new Error("Система з такою назвою вже існує")
        }
        console.error("Error creating game system:", error)
        throw error
    }
}

export async function updateGameSystem(
    gameId: string,
    systemId: string,
    data: { name: string; description?: string },
): Promise<System> {
    try {
        const response = await axiosInstance.put(`/games/${gameId}/systems/${systemId}`, data)
        console.log("[v0] updateGameSystem response:", response.data)

        // Handle both wrapped and direct response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            throw new Error("Система з такою назвою вже існує")
        }
        console.error("Error updating game system:", error)
        throw error
    }
}

export async function deleteGameSystem(gameId: string, systemId: string): Promise<void> {
    try {
        await axiosInstance.delete(`/games/${gameId}/systems/${systemId}`)
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
            throw new Error("Не можна видалити систему, яка використовується")
        }
        console.error("Error deleting game system:", error)
        throw error
    }
}
