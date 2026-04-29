// Promotion Configuration Types

export interface PromotionConfig {
    filter?: {
        excludeCategories?: string[]
        excludeProducts?: string[]
    }
    conditions?: {
        // Cart conditions (only one from this group)
        cartConditions?: {
            cart_total?: number
            cart_item_count?: number
        }

        // Item conditions (only one from this group)
        itemConditions?: {
            contains_category?: {
                mode: "include" | "exclude"
                logic: "any" | "all"
                values: string[]
            }
            contains_product?: {
                mode: "include" | "exclude"
                logic: "any" | "all"
                values: string[]
            }
            contains_activity?: {
                mode: "include" | "exclude"
                logic: "any" | "all"
                values: string[]
            }
        }

        // Member conditions (only one from this group)
        memberConditions?: {
            member_is_new?: number
            member_is_birthday?: number
            max_usage_per_member?: { limit: number, period: "global" | "year" | "month" }
        }
    }
    effects?: {
        // Price adjustments (only one active)
        price?: {
            type: "percentage" | "fixed" | "override"
            value: number
            applyTo?: "cart" | "matched_items" // For percentage
        }

        // Loyalty rewards (only one active)
        points?: {
            type: "multiplier" | "bonus"
            value: number
        }

        // Inventory additions
        inventory?: {
            add_free_item?: string // Product ID
        }
    }
    actions?: {
        // To be implemented later
        [key: string]: any
    }
}

export type ConditionType =
    | "cart_total"
    | "cart_item_count"
    | "contains_category"
    | "contains_product"
    | "contains_activity"
    | "member_is_new"
    | "member_is_birthday"
    | "max_usage_per_member"

export interface ConditionOption {
    type: ConditionType
    label: string
    category: "Cart" | "Items" | "Member"
    icon: string
}

export const CONDITION_OPTIONS: ConditionOption[] = [
    // Cart conditions
    { type: "cart_total", label: "Мінімальна сума", category: "Cart", icon: "🛒" },
    { type: "cart_item_count", label: "Мінімальна кількість товарів", category: "Cart", icon: "🔢" },

    // Item conditions
    { type: "contains_category", label: "Категорія", category: "Items", icon: "📁" },
    { type: "contains_product", label: "Продукт", category: "Items", icon: "📦" },
    { type: "contains_activity", label: "Активність", category: "Items", icon: "🎯" },

    // Member conditions
    { type: "member_is_new", label: "New Member", category: "Member", icon: "🆕" },
    { type: "member_is_birthday", label: "День народження", category: "Member", icon: "🎂" },
    { type: "max_usage_per_member", label: "Максимальних використань на користувача", category: "Member", icon: "🔄" },
]
