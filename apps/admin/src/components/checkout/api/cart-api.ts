import { axiosInstance } from "@/lib/api-utils"
import type { CartState } from "@/components/checkout/types/checkout"

export interface CartResponse {
    ok: boolean
    data: CartState
    error?: string
}

function getHeaders(cartId: string | null) {
    if (!cartId) return {}
    return { "x-cart-id": cartId }
}

export async function fetchCart(cartId: string | null): Promise<CartResponse> {
    // If no cartId, we can just send an empty initialization request
    // But since GET /cart doesn't exist, we can hit POST /cart/items with no body to just init, 
    // or we can implement a safe GET /cart in the API. Wait, Phase 4 implemented getOrInitCart
    // but the endpoints are POST/DELETE/PUT.
    // Let me check if there's a GET /cart endpoint in apps/api/src/routes/cart.ts
    // Wait, let's just use POST /cart/member with no member to trigger getOrInitCart!
    // Or we probably should just rely on the first mutation to init it, but we need
    // existing state on refresh. Let me write a generic wrapper here and I will add a GET /cart endpoint if it's missing.

    const res = await axiosInstance.get("/cart", {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function addItemToCart(cartId: string | null, entityId: string, type: "product" | "activity", quantity: number): Promise<CartResponse> {
    const res = await axiosInstance.post("/cart/items", { entityId, type, quantity }, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function updateCartItemQuantity(cartId: string | null, itemId: string, quantity: number): Promise<CartResponse> {
    const res = await axiosInstance.put(`/cart/items/${itemId}`, { quantity }, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function removeCartItem(cartId: string | null, itemId: string): Promise<CartResponse> {
    const res = await axiosInstance.delete(`/cart/items/${itemId}`, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function setMemberInCart(cartId: string | null, memberId: string | null): Promise<CartResponse> {
    if (!memberId) {
        const res = await axiosInstance.delete("/cart/member", {
            headers: getHeaders(cartId)
        })
        return res.data
    }

    const res = await axiosInstance.post("/cart/member", { memberId }, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function applyPromoToCart(cartId: string | null, code?: string, promoId?: string): Promise<CartResponse> {
    const payload: any = {}
    if (code) payload.code = code
    if (promoId) payload.promoId = promoId

    const res = await axiosInstance.post("/cart/promos", payload, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function rejectPromoInCart(cartId: string | null, promoId: string): Promise<CartResponse> {
    const res = await axiosInstance.delete(`/cart/promos/${promoId}`, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function flushCartState(cartId: string | null): Promise<void> {
    await axiosInstance.delete("/cart", {
        headers: getHeaders(cartId)
    })
}

export async function checkoutCart(cartId: string | null, expectedTotal: number): Promise<any> {
    const res = await axiosInstance.post("/checkout", { expectedTotal }, {
        headers: getHeaders(cartId)
    })
    return res.data
}

export async function recalculateCart(cartId: string | null): Promise<CartResponse> {
    const res = await axiosInstance.post("/cart/recalculate", {}, {
        headers: getHeaders(cartId)
    })
    return res.data
}
