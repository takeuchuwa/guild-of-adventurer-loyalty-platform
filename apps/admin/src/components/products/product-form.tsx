"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, X, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Product } from "@/components/products/types/product"
import { z } from "zod"
import { type ProductFormData, productSchema } from "@/components/products/types/validations/product-validation"
import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"

interface ProductFormProps {
    initialData?: Product
    onSubmit: (data: ProductFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
    showCreateAndAdd?: boolean
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading = false, mode, showCreateAndAdd }: ProductFormProps) {
    const [submitAction, setSubmitAction] = useState<"standard" | "createAndAdd">("standard")
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategories, setSelectedCategories] = useState<Array<{ categoryId: string; name: string }>>(
        initialData?.categories?.map((c) => ({ categoryId: c.categoryId, name: c.name })) || [],
    )

    const [isInfinite, setIsInfinite] = useState<boolean>(initialData ? initialData.inventory === -1 : true)

    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || "",
        sku: initialData?.sku || "",
        price: initialData?.price || 0,
        overridePoints: initialData?.overridePoints ?? null,
        categoryIds: initialData?.categories?.map((c) => c.categoryId) || [],
        inventory: initialData?.inventory ?? -1,
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                sku: initialData.sku || "",
                price: initialData.price || 0,
                overridePoints: initialData.overridePoints ?? null,
                categoryIds: initialData.categories?.map((c) => c.categoryId) || [],
                inventory: initialData.inventory ?? -1,
            })
            setIsInfinite(initialData.inventory === -1)

            if (initialData.categories) {
                setSelectedCategories(initialData.categories.map((c) => ({ categoryId: c.categoryId, name: c.name })))
            }
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            productSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof ProductFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof ProductFormData] = err.message
                    }
                })
                setErrors(newErrors)
            }
            return false
        }
    }

    const handleCategorySelection = (categoriesMap: Map<string, any>) => {
        const categoryIds = Array.from(categoriesMap.keys())
        setFormData({ ...formData, categoryIds })
        setSelectedCategories(Array.from(categoriesMap.values()).map((c) => ({ categoryId: c.categoryId, name: c.name })))
        if (errors.categoryIds) {
            setErrors({ ...errors, categoryIds: undefined })
        }
    }

    const handleRemoveCategory = (categoryId: string) => {
        const newCategories = selectedCategories.filter((c) => c.categoryId !== categoryId)
        setSelectedCategories(newCategories)
        setFormData({ ...formData, categoryIds: newCategories.map((c) => c.categoryId) })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            await (onSubmit as any)(formData, submitAction === "createAndAdd")
        } catch (error) {
            console.error("Form submission error:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Назва товару <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value })
                            if (errors.name) {
                                setErrors({ ...errors, name: undefined })
                            }
                        }}
                        placeholder="Введіть назву товару"
                        disabled={isLoading}
                        className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <Label htmlFor="sku">SKU</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                        <HelpCircle className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-sm p-3">
                                    <p className="font-semibold mb-1">Що таке SKU?</p>
                                    <p className="text-muted-foreground text-xs leading-normal">
                                        <strong>SKU (Stock Keeping Unit)</strong> — це унікальний ідентифікатор товару (зазвичай 11 цифр). Він використовується для обліку залишків на складі та ідентифікації товарів під час продажу на касі або сканування.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => {
                            setFormData({ ...formData, sku: e.target.value })
                            if (errors.sku) {
                                setErrors({ ...errors, sku: undefined })
                            }
                        }}
                        placeholder="11 цифр або залишіть порожнім"
                        disabled={isLoading}
                        className={errors.sku ? "border-destructive" : ""}
                        maxLength={11}
                    />
                    {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                    <p className="text-sm text-muted-foreground">Якщо не вказано, буде згенеровано автоматично</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">
                        Ціна <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price === 0 ? "" : formData.price}
                        onChange={(e) => {
                            const inputValue = e.target.value
                            const numValue = inputValue === "" ? 0 : Number.parseFloat(inputValue)
                            setFormData({ ...formData, price: isNaN(numValue) ? 0 : numValue })
                            if (errors.price) {
                                setErrors({ ...errors, price: undefined })
                            }
                        }}
                        placeholder="0.00"
                        disabled={isLoading}
                        className={errors.price ? "border-destructive" : ""}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="overridePoints">Бали за товар (вручну)</Label>
                    <Input
                        id="overridePoints"
                        type="number"
                        min="0"
                        value={formData.overridePoints ?? ""}
                        onChange={(e) => {
                            const value = e.target.value === "" ? null : Number.parseInt(e.target.value)
                            setFormData({ ...formData, overridePoints: value })
                            if (errors.overridePoints) {
                                setErrors({ ...errors, overridePoints: undefined })
                            }
                        }}
                        placeholder="Залиште порожнім — буде нараховано автоматично (10% ціни)"
                        disabled={isLoading}
                        className={errors.overridePoints ? "border-destructive" : ""}
                    />
                    {errors.overridePoints && <p className="text-sm text-destructive">{errors.overridePoints}</p>}
                    <p className="text-sm text-muted-foreground">Якщо не вказано, буде використано 10% від ціни</p>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="isInfinite"
                            checked={isInfinite}
                            onCheckedChange={(checked) => {
                                const isChecked = checked === true
                                setIsInfinite(isChecked)
                                setFormData({
                                    ...formData,
                                    inventory: isChecked ? -1 : (initialData && initialData.inventory !== -1 ? initialData.inventory : 0),
                                })
                                if (errors.inventory) {
                                    setErrors({ ...errors, inventory: undefined })
                                }
                            }}
                            disabled={isLoading}
                        />
                        <Label htmlFor="isInfinite" className="cursor-pointer">
                            Необмежена кількість на складі
                        </Label>
                    </div>

                    {!isInfinite && (
                        <div className="space-y-2">
                            <Label htmlFor="inventory">
                                Кількість на складі <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="inventory"
                                type="number"
                                min="0"
                                value={formData.inventory === -1 ? "" : formData.inventory}
                                onChange={(e) => {
                                    const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                                    setFormData({ ...formData, inventory: isNaN(value) ? 0 : value })
                                    if (errors.inventory) {
                                        setErrors({ ...errors, inventory: undefined })
                                    }
                                }}
                                placeholder="Введіть кількість товару на складі"
                                disabled={isLoading}
                                className={errors.inventory ? "border-destructive" : ""}
                            />
                            {errors.inventory && <p className="text-sm text-destructive">{errors.inventory}</p>}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>
                        Категорії <span className="text-destructive">*</span>
                    </Label>
                    {selectedCategories.length > 0 ? (
                        <div className="space-y-2">
                            {selectedCategories.map((category) => (
                                <div key={category.categoryId} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <p className="flex-1 font-semibold">{category.name}</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveCategory(category.categoryId)}
                                        disabled={isLoading}
                                        className="cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCategoryDialogOpen(true)}
                                className="w-full cursor-pointer"
                                disabled={isLoading}
                            >
                                Змінити категорії
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryDialogOpen(true)}
                            className="w-full cursor-pointer"
                            disabled={isLoading}
                        >
                            Обрати категорії
                        </Button>
                    )}
                    {errors.categoryIds && <p className="text-sm text-destructive">{errors.categoryIds}</p>}
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <Button
                    type="button"
                    className="cursor-pointer bg-transparent"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Скасувати
                </Button>
                {showCreateAndAdd ? (
                    <Button
                        type="submit"
                        className="cursor-pointer"
                        disabled={isLoading}
                        onClick={() => setSubmitAction("createAndAdd")}
                    >
                        {isLoading && submitAction === "createAndAdd" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Створити та додати в кошик
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        className="cursor-pointer"
                        disabled={isLoading}
                        onClick={() => setSubmitAction("standard")}
                    >
                        {isLoading && submitAction === "standard" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "create" ? "Створити" : "Зберегти"}
                    </Button>
                )}
            </div>

            <CategorySelectionDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                onConfirm={handleCategorySelection}
                initialCategoryIds={selectedCategories.map((c) => c.categoryId)}
                kind="PRODUCT"
            />
        </form>
    )
}
