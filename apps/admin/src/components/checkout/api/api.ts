import { axiosInstance } from "@/lib/api-utils"
import type { Product } from "@/components/products/types/product"
import type { Activity } from "@/components/activities/types/activity"
import type { Member } from "@/components/members/types/member"

export interface CheckoutItem {
    type: "product" | "activity"
    id: string
    quantity: number
}

export interface CheckoutRequest {
    memberId?: string
    items: CheckoutItem[]
}

export interface CheckoutResponse {
    entriesCreated: number
    totalPoints: number
}

export interface MemberWithLoyalty {
    member: Member
    level: {
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
    } | null
}

export async function processCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
    try {
        const response = await axiosInstance.post("/checkout", data)

        if (!response.data.ok) {
            throw new Error(response.data.error || "Failed to process checkout")
        }

        return response.data.data
    } catch (error: any) {
        console.error("Error processing checkout:", error)
        throw new Error(error.response?.data?.error || "Помилка при обробці каси")
    }
}

export async function getMemberLoyalty(memberId: string): Promise<MemberWithLoyalty> {
    try {
        const response = await axiosInstance.get(`/members/loyalty/${memberId}`)

        if (!response.data.ok) {
            throw new Error(response.data.message || "Failed to get member loyalty info")
        }

        return response.data.data
    } catch (error: any) {
        console.error("Error getting member loyalty:", error)
        throw new Error(error.response?.data?.message || "Помилка при отриманні інформації про учасника")
    }
}

export async function searchMembers(query: string): Promise<Member[]> {
    try {
        const response = await axiosInstance.get("/members", {
            params: {
                q: query,
                page: 0,
                pageSize: 10,
            },
        })

        if (!response.data.ok) {
            throw new Error("Failed to search members")
        }

        return response.data.data || []
    } catch (error) {
        console.error("Error searching members:", error)
        return []
    }
}

export async function searchProducts(query: string): Promise<Product[]> {
    try {
        const response = await axiosInstance.get("/products", {
            params: {
                q: query,
                page: 0,
                pageSize: 5,
            },
        })

        if (!response.data.ok) {
            throw new Error("Failed to search products")
        }

        return response.data.data || []
    } catch (error) {
        console.error("Error searching products:", error)
        return []
    }
}

export async function searchActivities(query: string): Promise<Activity[]> {
    try {
        const response = await axiosInstance.get("/activities", {
            params: {
                q: query,
                page: 0,
                pageSize: 5,
            },
        })

        if (!response.data.ok) {
            throw new Error("Failed to search activities")
        }

        return response.data.data || []
    } catch (error) {
        console.error("Error searching activities:", error)
        return []
    }
}

export async function verifyMemberQR(payloadObj: { type: string, payload: string }): Promise<Member> {
    try {
        const response = await axiosInstance.post("/members/verify", payloadObj)
        if (!response.data.ok) {
             throw new Error(response.data.message || "Очікувався QR учасника.")
        }
        return response.data.data
    } catch (error: any) {
        console.error("Error verifying member QR:", error)
        throw new Error(error.response?.data?.message || "Помилка при перевірці QR коду")
    }
}
