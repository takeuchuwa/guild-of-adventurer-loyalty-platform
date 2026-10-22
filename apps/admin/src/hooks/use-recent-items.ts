import { useCallback, useEffect, useRef, useState } from "react"

import { fetchProducts } from "@/components/products/api/products-api"
import { fetchActivities } from "@/components/activities/api/activity-api"
import type { GridItem } from "@/components/checkout/item-grid"

const STORAGE_KEY = "vezha.checkout.recent"
const MAX_RECENT = 12

interface StoredItem extends GridItem {
    /** When it was last added to a cart — the sort key. */
    ts: number
}

function read(): StoredItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item) => item && typeof item.id === "string" && typeof item.type === "string")
    } catch {
        return []
    }
}

function write(items: StoredItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
        // Private mode / quota — the strip is a convenience, not a requirement.
    }
}

/**
 * The Каса's "recently used" strip.
 *
 * The full tile is cached in localStorage so the strip paints instantly on load,
 * then revalidated once per entity type via `GET /products?ids=…` and
 * `GET /activities?ids=…`. That is two reads for the whole strip regardless of
 * its length — and it is the revalidation, not the cache, that decides what the
 * cashier sees: prices and stock move, and items get deleted.
 */
export function useRecentItems() {
    const [recent, setRecent] = useState<StoredItem[]>([])
    const revalidated = useRef(false)

    useEffect(() => {
        const cached = read()
        setRecent(cached)

        if (revalidated.current || cached.length === 0) return
        revalidated.current = true

        const productIds = cached.filter((i) => i.type === "product").map((i) => i.id)
        const activityIds = cached.filter((i) => i.type === "activity").map((i) => i.id)

        let active = true

        const loadProducts = productIds.length
            ? fetchProducts({
                pagination: { pageSize: productIds.length },
                sorting: [],
                filterParams: { ids: productIds.join(",") },
            }).then((res) => res.products)
            : Promise.resolve([])

        const loadActivities = activityIds.length
            ? fetchActivities({
                pagination: { pageSize: activityIds.length },
                sorting: [],
                filterParams: { ids: activityIds.join(",") },
            }).then((res) => res.activities)
            : Promise.resolve([])

        Promise.all([loadProducts, loadActivities])
            .then(([products, activities]) => {
                if (!active) return

                const fresh = new Map<string, GridItem>()
                for (const p of products) {
                    fresh.set(`product:${p.productId}`, {
                        id: p.productId,
                        type: "product",
                        name: p.name ?? "",
                        price: p.price,
                        inventory: p.inventory,
                    })
                }
                for (const a of activities) {
                    fresh.set(`activity:${a.activityId}`, {
                        id: a.activityId,
                        type: "activity",
                        name: a.name,
                        price: a.price,
                        startDate: a.startDate,
                    })
                }

                // Anything the server no longer returns was deleted — drop it. But
                // `fetchProducts`/`fetchActivities` answer a failed request with an
                // empty list, so only prune a type that actually came back with
                // something; otherwise a flaky network would wipe the strip.
                const canPrune = { product: products.length > 0, activity: activities.length > 0 }

                const next = cached
                    .map((item) => {
                        const update = fresh.get(`${item.type}:${item.id}`)
                        if (update) return { ...update, ts: item.ts }
                        return canPrune[item.type] ? null : item
                    })
                    .filter((item): item is StoredItem => item !== null)

                setRecent(next)
                write(next)
            })
            .catch((error) => console.error("[useRecentItems] revalidate failed", error))

        return () => {
            active = false
        }
    }, [])

    const remember = useCallback((item: GridItem) => {
        setRecent((prev) => {
            const next = [
                { ...item, ts: Date.now() },
                ...prev.filter((i) => !(i.id === item.id && i.type === item.type)),
            ].slice(0, MAX_RECENT)
            write(next)
            return next
        })
    }, [])

    return { recent, remember }
}
