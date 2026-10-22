"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"
import { ProductSelectionDialog } from "@/components/shared/dialogs/product-selection-dialog"
import { ActivitySelectionDialog } from "@/components/shared/dialogs/activity-selection-dialog"
import type { Category } from "@/components/categories/types/category-types"
import type { Product } from "@/components/products/types/product"
import type { Activity } from "@/components/activities/types/activity"
import { Layers, Package, CalendarDays, Gamepad2, X } from "lucide-react"

export function TargetsSection({ targetsMap }: { targetsMap?: Record<string, string> }) {
    const { watch, setValue } = useFormContext()

    const targetType: string = watch("config.targets.type") || "cart"
    const entitySubType: string = watch("config.targets.entitySubType") || "products"
    const targetCategories: string[] = watch("config.targets.categories") || []
    const targetProducts: string[] = watch("config.targets.products") || []
    const targetActivities: string[] = watch("config.targets.activities") || []

    // Local display maps to show names alongside IDs (form only stores IDs)
    const [categoryDisplayMap, setCategoryDisplayMap] = useState<Map<string, Category>>(new Map())
    const [productDisplayMap, setProductDisplayMap] = useState<Map<string, Product>>(new Map())
    const [activityDisplayMap, setActivityDisplayMap] = useState<Map<string, Activity>>(new Map())

    useEffect(() => {
        if (!targetsMap) return

        const newCatMap = new Map<string, Category>()
        targetCategories.forEach((id) => {
            if (targetsMap[id]) {
                newCatMap.set(id, { categoryId: id, name: targetsMap[id] } as any)
            }
        })
        if (newCatMap.size > 0) {
            setCategoryDisplayMap(prev => {
                const merged = new Map(prev)
                newCatMap.forEach((v, k) => {
                    if (!merged.has(k)) merged.set(k, v)
                })
                return merged
            })
        }

        const newProdMap = new Map<string, Product>()
        targetProducts.forEach((id) => {
            if (targetsMap[id]) {
                newProdMap.set(id, { productId: id, name: targetsMap[id] } as any)
            }
        })
        if (newProdMap.size > 0) {
            setProductDisplayMap(prev => {
                const merged = new Map(prev)
                newProdMap.forEach((v, k) => {
                    if (!merged.has(k)) merged.set(k, v)
                })
                return merged
            })
        }

        const newActMap = new Map<string, Activity>()
        targetActivities.forEach((id) => {
            if (targetsMap[id]) {
                newActMap.set(id, { activityId: id, name: targetsMap[id] } as any)
            }
        })
        if (newActMap.size > 0) {
            setActivityDisplayMap(prev => {
                const merged = new Map(prev)
                newActMap.forEach((v, k) => {
                    if (!merged.has(k)) merged.set(k, v)
                })
                return merged
            })
        }
    }, [targetsMap])

    // Dialog open states
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [productDialogOpen, setProductDialogOpen] = useState(false)
    const [activityDialogOpen, setActivityDialogOpen] = useState(false)

    const handleTargetTypeChange = (value: string) => {
        setValue("config.targets.type", value, { shouldDirty: true })
        if (value === "cart" || value === "entity") {
            // Clear item targets when not in "items" mode
            setValue("config.targets.categories", [], { shouldDirty: true })
            setValue("config.targets.products", [], { shouldDirty: true })
            setValue("config.targets.activities", [], { shouldDirty: true })
        }
        if (value === "entity") {
            // Default sub-type when switching to entity
            setValue("config.targets.entitySubType", "products", { shouldDirty: true })
        }
    }

    const handleEntitySubTypeChange = (value: string) => {
        setValue("config.targets.entitySubType", value, { shouldDirty: true })
    }

    // --- Handlers ---

    const handleCategoriesConfirm = (categoriesMap: Map<string, Category>) => {
        setCategoryDisplayMap((prev) => {
            const merged = new Map(prev)
            categoriesMap.forEach((cat, id) => merged.set(id, cat))
            return merged
        })
        const categoryIds = Array.from(new Set([...targetCategories, ...Array.from(categoriesMap.keys())]))
        setValue("config.targets.categories", categoryIds, { shouldDirty: true })
    }

    const handleProductsConfirm = (productsMap: Map<string, Product>) => {
        setProductDisplayMap((prev) => {
            const merged = new Map(prev)
            productsMap.forEach((prod, id) => merged.set(id, prod))
            return merged
        })
        const productIds = Array.from(new Set([...targetProducts, ...Array.from(productsMap.keys())]))
        setValue("config.targets.products", productIds, { shouldDirty: true })
    }

    const handleActivitiesConfirm = (activitiesMap: Map<string, Activity>) => {
        setActivityDisplayMap((prev) => {
            const merged = new Map(prev)
            activitiesMap.forEach((act, id) => merged.set(id, act))
            return merged
        })
        const activityIds = Array.from(new Set([...targetActivities, ...Array.from(activitiesMap.keys())]))
        setValue("config.targets.activities", activityIds, { shouldDirty: true })
    }

    const handleRemoveCategory = (categoryId: string) => {
        const updated = targetCategories.filter((id: string) => id !== categoryId)
        setValue("config.targets.categories", updated, { shouldDirty: true })
        setCategoryDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(categoryId)
            return next
        })
    }

    const handleRemoveProduct = (productId: string) => {
        const updated = targetProducts.filter((id: string) => id !== productId)
        setValue("config.targets.products", updated, { shouldDirty: true })
        setProductDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(productId)
            return next
        })
    }

    const handleRemoveActivity = (activityId: string) => {
        const updated = targetActivities.filter((id: string) => id !== activityId)
        setValue("config.targets.activities", updated, { shouldDirty: true })
        setActivityDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(activityId)
            return next
        })
    }

    return (
        <div>
            <h4 className="font-semibold mb-2">До чого застосувати?</h4>
            <p className="text-sm text-muted-foreground mb-4">
                Оберіть, на що саме буде поширюватися промоакція. Елементи з розділу «Виключення» завжди ігноруються.
            </p>

            <div className="space-y-4">
                {/* Top-level Target Type */}
                <RadioGroup
                    value={targetType}
                    onValueChange={handleTargetTypeChange}
                    className="space-y-3"
                >
                    {/* Option 1: Whole cart */}
                    <div className="flex items-start space-x-2">
                        <RadioGroupItem value="cart" id="target-cart" className="cursor-pointer mt-0.5" />
                        <div>
                            <Label htmlFor="target-cart" className="font-normal cursor-pointer">
                                Весь кошик
                            </Label>
                            <p className="text-xs text-muted-foreground">Знижка на все замовлення цілком</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        <RadioGroupItem value="entity" id="target-entity" className="cursor-pointer mt-0.5" />
                        <div>
                            <Label htmlFor="target-entity" className="font-normal cursor-pointer">
                                Усі товари або всі сесії певного типу
                            </Label>
                            <p className="text-xs text-muted-foreground">Обрати категорію: товари, сесії або ігри</p>
                        </div>
                    </div>

                    {/* Option 2: Specific items (category / product / activity pickers) */}
                    <div className="flex items-start space-x-2">
                        <RadioGroupItem value="items" id="target-items" className="cursor-pointer mt-0.5" />
                        <div>
                            <Label htmlFor="target-items" className="font-normal cursor-pointer">
                                Конкретні товари / сесії
                            </Label>
                            <p className="text-xs text-muted-foreground">Обрати вручну з каталогу, категорії або сесії</p>
                        </div>
                    </div>
                </RadioGroup>

                {/* Item Selectors — shown only when "items" is selected */}
                {targetType === "items" && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                        {/* Target Categories */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCategoryDialogOpen(true)}
                                className="w-full cursor-pointer"
                            >
                                <Layers className="mr-2 h-4 w-4" />
                                Категорії
                                {targetCategories.length > 0 && (
                                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5">
                                        {targetCategories.length}
                                    </span>
                                )}
                            </Button>
                            {targetCategories.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {targetCategories.map((catId: string) => {
                                        const cat = categoryDisplayMap.get(catId)
                                        return (
                                            <div
                                                key={catId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm"
                                            >
                                                <Layers className="h-3 w-3" />
                                                <span>{cat?.name || catId}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCategory(catId)}
                                                    className="hover:bg-primary/20 p-0.5 transition-colors cursor-pointer"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Target Products */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setProductDialogOpen(true)}
                                className="w-full cursor-pointer"
                            >
                                <Package className="mr-2 h-4 w-4" />
                                Товари
                                {targetProducts.length > 0 && (
                                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5">
                                        {targetProducts.length}
                                    </span>
                                )}
                            </Button>
                            {targetProducts.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {targetProducts.map((prodId: string) => {
                                        const prod = productDisplayMap.get(prodId)
                                        return (
                                            <div
                                                key={prodId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm"
                                            >
                                                <Package className="h-3 w-3" />
                                                <span>{prod?.name || prodId}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProduct(prodId)}
                                                    className="hover:bg-primary/20 p-0.5 transition-colors cursor-pointer"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Target Activities */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActivityDialogOpen(true)}
                                className="w-full cursor-pointer"
                            >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Сесії (активності)
                                {targetActivities.length > 0 && (
                                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5">
                                        {targetActivities.length}
                                    </span>
                                )}
                            </Button>
                            {targetActivities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {targetActivities.map((actId: string) => {
                                        const act = activityDisplayMap.get(actId)
                                        return (
                                            <div
                                                key={actId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm"
                                            >
                                                <CalendarDays className="h-3 w-3" />
                                                <span>{act?.name || actId}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveActivity(actId)}
                                                    className="hover:bg-primary/20 p-0.5 transition-colors cursor-pointer"
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
                )}

                {/* Entity sub-type — shown only when "entity" is selected */}
                {targetType === "entity" && (
                    <div className="pl-6 border-l-2 border-muted">
                        <p className="text-xs text-muted-foreground mb-3">
                            Промоакція поширюється на всі елементи обраного типу, не потребуючи додаткових налаштувань
                        </p>
                        <RadioGroup
                            value={entitySubType}
                            onValueChange={handleEntitySubTypeChange}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="products" id="entity-products" className="cursor-pointer" />
                                <Label htmlFor="entity-products" className="font-normal cursor-pointer flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    Товари
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sessions" id="entity-sessions" className="cursor-pointer" />
                                <Label htmlFor="entity-sessions" className="font-normal cursor-pointer flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    Сесії (активності не по рольовим системам, квести, майстер класи і т.п.)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="games" id="entity-games" className="cursor-pointer" />
                                <Label htmlFor="entity-games" className="font-normal cursor-pointer flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                                    Ігри (активності проведені по рольовим системам, ваншоти, кампанії і т.п.)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                )}
            </div>

            {/* Category Selection Dialog */}
            <CategorySelectionDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                onConfirm={handleCategoriesConfirm}
                initialCategoryIds={targetCategories}
            />

            {/* Product Selection Dialog */}
            <ProductSelectionDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                selectionMode="multiple"
                onConfirm={handleProductsConfirm}
                initialProductIds={targetProducts}
            />

            {/* Activity Selection Dialog */}
            <ActivitySelectionDialog
                open={activityDialogOpen}
                onOpenChange={setActivityDialogOpen}
                selectionMode="multiple"
                onConfirm={handleActivitiesConfirm}
                initialActivityIds={targetActivities}
            />
        </div>
    )
}
