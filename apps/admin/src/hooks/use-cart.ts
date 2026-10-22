import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { CartState, DonationPayload } from "@/components/checkout/types/checkout"
import {
    fetchCart,
    addItemToCart,
    addDonationToCart,
    updateCartItemQuantity,
    removeCartItem,
    setMemberInCart,
    applyPromoToCart,
    rejectPromoInCart,
    flushCartState,
    checkoutCart,
    recalculateCart
} from "@/components/checkout/api/cart-api"

export function useCart() {
    const [cartState, setCartState] = useState<CartState | null>(null)
    const [isCartUpdating, setIsCartUpdating] = useState(false)
    const [isCartLoading, setIsCartLoading] = useState(true)

    const getCartId = () => localStorage.getItem("pos_cart_id")
    const saveCartId = (id: string) => localStorage.setItem("pos_cart_id", id)
    const clearCartId = () => localStorage.removeItem("pos_cart_id")

    /**
     * Pulls a cart from the server; `null` asks for a brand new empty one. Used
     * on mount and after checkout/flush, so the till never sits on an absent
     * cart — an empty cart is a state the cashier can work from, `null` is not.
     */
    const loadCart = useCallback(async (cartId: string | null) => {
        setIsCartLoading(true)
        try {
            const res = await fetchCart(cartId)
            if (res.ok && res.data) {
                setCartState(res.data)
                saveCartId(res.data.cartId)
            } else {
                clearCartId()
                setCartState(null)
            }
        } catch (error) {
            console.error("Failed to load cart:", error)
            clearCartId()
            setCartState(null)
        } finally {
            setIsCartLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        loadCart(getCartId())
    }, [loadCart])

    const wrapCartAction = useCallback(async (action: () => Promise<any>) => {
        setIsCartUpdating(true)
        try {
            const res = await action()
            if (res && res.data && res.data.cartId) {
                setCartState(res.data)
                saveCartId(res.data.cartId)
            }
            return res
        } catch (error: any) {
            console.error("Cart action failed:", error)
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Сталася помилка"
            toast.error(msg)

            // Handle the 409 Conflict returning updated cart state
            if (error.response?.status === 409 && error.response?.data?.data?.cartId) {
                setCartState(error.response.data.data)
                saveCartId(error.response.data.data.cartId)
            }

            throw error
        } finally {
            setIsCartUpdating(false)
        }
    }, [])

    const addItem = (entityId: string, type: "product" | "activity", quantity: number = 1) => {
        return wrapCartAction(() => addItemToCart(getCartId(), entityId, type, quantity))
    }

    const addDonation = (payload: DonationPayload) => {
        return wrapCartAction(() => addDonationToCart(getCartId(), payload))
    }

    const updateQuantity = (itemId: string, newQuantity: number) => {
        return wrapCartAction(() => updateCartItemQuantity(getCartId(), itemId, newQuantity))
    }

    const removeItem = (itemId: string) => {
        return wrapCartAction(() => removeCartItem(getCartId(), itemId))
    }

    const setMember = (memberId: string | null) => {
        return wrapCartAction(() => setMemberInCart(getCartId(), memberId))
    }

    const applyPromo = (code?: string, promoId?: string) => {
        return wrapCartAction(() => applyPromoToCart(getCartId(), code, promoId))
    }

    const rejectPromo = (promoId: string) => {
        return wrapCartAction(() => rejectPromoInCart(getCartId(), promoId))
    }

    const refreshCart = () => {
        return wrapCartAction(() => recalculateCart(getCartId()))
    }

    const flushCart = async () => {
        setIsCartUpdating(true)
        try {
            await flushCartState(getCartId())
            clearCartId()
            await loadCart(null)
        } catch (error: any) {
            toast.error(error.message || "Помилка при очищенні кошика")
        } finally {
            setIsCartUpdating(false)
        }
    }

    const generateCheckout = async (expectedTotal: number) => {
        setIsCartUpdating(true)
        try {
            const res = await checkoutCart(getCartId(), expectedTotal)
            clearCartId()
            // The sold cart is gone server-side; start the next sale on a clean one.
            await loadCart(null)
            toast.success("Каса успішно закрита! Бали нараховані!")
            return res
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Помилка при обробці каси"
            toast.error(msg)

            // If 409 conflict, update local state to reflect the conflict changes
            if (error.response?.status === 409 && error.response?.data?.data?.cartId) {
                setCartState(error.response.data.data)
                saveCartId(error.response.data.data.cartId)
            }
            throw error
        } finally {
            setIsCartUpdating(false)
        }
    }

    return {
        cartState,
        isCartUpdating,
        isCartLoading,
        actions: {
            addItem,
            addDonation,
            updateQuantity,
            removeItem,
            setMember,
            applyPromo,
            rejectPromo,
            flushCart,
            refreshCart,
            checkout: generateCheckout
        }
    }
}
