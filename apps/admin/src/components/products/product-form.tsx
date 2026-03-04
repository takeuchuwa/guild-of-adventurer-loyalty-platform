"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
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
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: ProductFormProps) {
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [selectedCategories, setSelectedCategories] = useState<Array<{ categoryId: string; name: string }>>(
        initialData?.categories?.map((c) => ({ categoryId: c.categoryId, name: c.name })) || [],
    )

    const [formData, setFormData] = useState<ProductFormData>({
        name: initialData?.name || "",
        sku: initialData?.sku || "",
        price: initialData?.price || 0,
        overridePoints: initialData?.overridePoints ?? null,
        categoryIds: initialData?.categories?.map((c) => c.categoryId) || [],
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
            })

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
            await onSubmit(formData)
        } catch (error) {
            console.error("Form submission error:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Назва продукту <span className="text-destructive">*</span>
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
                        placeholder="Введіть назву продукту"
                        disabled={isLoading}
                        className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
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
                    <Label htmlFor="overridePoints">Бали досвіду (необов'язково)</Label>
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
                        placeholder="Залишіть порожнім для автоматичного розрахунку (10% ціни)"
                        disabled={isLoading}
                        className={errors.overridePoints ? "border-destructive" : ""}
                    />
                    {errors.overridePoints && <p className="text-sm text-destructive">{errors.overridePoints}</p>}
                    <p className="text-sm text-muted-foreground">Якщо не вказано, буде використано 10% від ціни</p>
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
                <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
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
