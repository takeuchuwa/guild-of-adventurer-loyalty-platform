"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"
import { ProductSelectionDialog } from "@/components/shared/dialogs/product-selection-dialog"
import { ActivitySelectionDialog } from "@/components/shared/dialogs/activity-selection-dialog"
import type { Category } from "@/components/categories/types/category-types"
import type { Product } from "@/components/products/types/product"
import type { Activity } from "@/components/activities/types/activity"
import { Layers, Package, CalendarDays, X } from "lucide-react"

export function GlobalFilterSection() {
    const { watch, setValue } = useFormContext()

    const excludeCategories: string[] = watch("config.filter.excludeCategories") || []
    const excludeProducts: string[] = watch("config.filter.excludeProducts") || []
    const excludeActivities: string[] = watch("config.filter.excludeActivities") || []

    // Local display maps to show names alongside IDs (form only stores IDs)
    const [categoryDisplayMap, setCategoryDisplayMap] = useState<Map<string, Category>>(new Map())
    const [productDisplayMap, setProductDisplayMap] = useState<Map<string, Product>>(new Map())
    const [activityDisplayMap, setActivityDisplayMap] = useState<Map<string, Activity>>(new Map())

    // Dialog open states
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [productDialogOpen, setProductDialogOpen] = useState(false)
    const [activityDialogOpen, setActivityDialogOpen] = useState(false)

    // --- Handlers ---

    const handleCategoriesConfirm = (categoriesMap: Map<string, Category>) => {
        setCategoryDisplayMap((prev) => {
            const merged = new Map(prev)
            categoriesMap.forEach((cat, id) => merged.set(id, cat))
            return merged
        })
        const categoryIds = Array.from(new Set([...excludeCategories, ...Array.from(categoriesMap.keys())]))
        setValue("config.filter.excludeCategories", categoryIds, { shouldDirty: true })
    }

    const handleProductsConfirm = (productsMap: Map<string, Product>) => {
        setProductDisplayMap((prev) => {
            const merged = new Map(prev)
            productsMap.forEach((prod, id) => merged.set(id, prod))
            return merged
        })
        const productIds = Array.from(new Set([...excludeProducts, ...Array.from(productsMap.keys())]))
        setValue("config.filter.excludeProducts", productIds, { shouldDirty: true })
    }

    const handleActivitiesConfirm = (activitiesMap: Map<string, Activity>) => {
        setActivityDisplayMap((prev) => {
            const merged = new Map(prev)
            activitiesMap.forEach((act, id) => merged.set(id, act))
            return merged
        })
        const activityIds = Array.from(new Set([...excludeActivities, ...Array.from(activitiesMap.keys())]))
        setValue("config.filter.excludeActivities", activityIds, { shouldDirty: true })
    }

    const handleRemoveCategory = (categoryId: string) => {
        const updated = excludeCategories.filter((id: string) => id !== categoryId)
        setValue("config.filter.excludeCategories", updated, { shouldDirty: true })
        setCategoryDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(categoryId)
            return next
        })
    }

    const handleRemoveProduct = (productId: string) => {
        const updated = excludeProducts.filter((id: string) => id !== productId)
        setValue("config.filter.excludeProducts", updated, { shouldDirty: true })
        setProductDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(productId)
            return next
        })
    }

    const handleRemoveActivity = (activityId: string) => {
        const updated = excludeActivities.filter((id: string) => id !== activityId)
        setValue("config.filter.excludeActivities", updated, { shouldDirty: true })
        setActivityDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(activityId)
            return next
        })
    }

    return (
        <div>
            <h4 className="font-semibold mb-2">Глобальні виключення (Область дії)</h4>
            <p className="text-sm text-muted-foreground mb-4">
                Елементи, що відповідають цим правилам, будуть повністю ігноруватися промо-системою
            </p>

            <div className="space-y-4">
                {/* Exclude Categories */}
                <div className="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCategoryDialogOpen(true)}
                        className="w-full cursor-pointer"
                    >
                        <Layers className="mr-2 h-4 w-4" />
                        Виключити категорії
                        {excludeCategories.length > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {excludeCategories.length}
                            </span>
                        )}
                    </Button>
                    {excludeCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {excludeCategories.map((catId: string) => {
                                const cat = categoryDisplayMap.get(catId)
                                return (
                                    <div
                                        key={catId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        <Layers className="h-3 w-3" />
                                        <span>{cat?.name || catId}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCategory(catId)}
                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Exclude Products */}
                <div className="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProductDialogOpen(true)}
                        className="w-full cursor-pointer"
                    >
                        <Package className="mr-2 h-4 w-4" />
                        Виключити товари
                        {excludeProducts.length > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {excludeProducts.length}
                            </span>
                        )}
                    </Button>
                    {excludeProducts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {excludeProducts.map((prodId: string) => {
                                const prod = productDisplayMap.get(prodId)
                                return (
                                    <div
                                        key={prodId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        <Package className="h-3 w-3" />
                                        <span>{prod?.name || prodId}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProduct(prodId)}
                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Exclude Activities */}
                <div className="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActivityDialogOpen(true)}
                        className="w-full cursor-pointer"
                    >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Виключити сесії
                        {excludeActivities.length > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {excludeActivities.length}
                            </span>
                        )}
                    </Button>
                    {excludeActivities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {excludeActivities.map((actId: string) => {
                                const act = activityDisplayMap.get(actId)
                                return (
                                    <div
                                        key={actId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        <CalendarDays className="h-3 w-3" />
                                        <span>{act?.name || actId}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveActivity(actId)}
                                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Selection Dialog */}
            <CategorySelectionDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                onConfirm={handleCategoriesConfirm}
                initialCategoryIds={excludeCategories}
            />

            {/* Product Selection Dialog */}
            <ProductSelectionDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                selectionMode="multiple"
                onConfirm={handleProductsConfirm}
                initialProductIds={excludeProducts}
            />

            {/* Activity Selection Dialog */}
            <ActivitySelectionDialog
                open={activityDialogOpen}
                onOpenChange={setActivityDialogOpen}
                selectionMode="multiple"
                onConfirm={handleActivitiesConfirm}
                initialActivityIds={excludeActivities}
            />
        </div>
    )
}
