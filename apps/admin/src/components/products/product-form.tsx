"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Product } from "@/components/products/types/product"
import { z } from "zod"
import { type ProductFormData, productSchema } from "@/components/products/types/validations/product-validation"
import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"
import { AddChip, Chip, FormField, FormShell, RailSection } from "@/components/shared/form-shell"

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
        <>
            <FormShell
                title={mode === "create" ? "Створити товар" : "Редагувати товар"}
                description={mode === "create" ? "Заповніть форму для створення нового товару" : "Оновіть інформацію про товар"}
                onSubmit={handleSubmit}
                rail={
                    <RailSection title="Лояльність">
                        <FormField
                            label="Бали за товар (вручну)"
                            htmlFor="overridePoints"
                            error={errors.overridePoints}
                            hint="Якщо не вказано, буде використано 10% від ціни"
                        >
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
                                aria-invalid={!!errors.overridePoints}
                            />
                        </FormField>
                    </RailSection>
                }
                actions={
                    <>
                        {showCreateAndAdd ? (
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full cursor-pointer"
                                disabled={isLoading}
                                onClick={() => setSubmitAction("createAndAdd")}
                            >
                                {isLoading && submitAction === "createAndAdd" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Створити та додати в кошик
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full cursor-pointer"
                                disabled={isLoading}
                                onClick={() => setSubmitAction("standard")}
                            >
                                {isLoading && submitAction === "standard" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === "create" ? "Створити" : "Зберегти"}
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="w-full cursor-pointer"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Скасувати
                        </Button>
                    </>
                }
            >
                <FormField label="Назва товару" htmlFor="name" required error={errors.name}>
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
                        aria-invalid={!!errors.name}
                    />
                </FormField>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <FormField
                        label="SKU"
                        htmlFor="sku"
                        error={errors.sku}
                        hint="Якщо не вказано, буде згенеровано автоматично"
                        labelAdornment={
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
                        }
                    >
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
                            className="font-mono"
                            aria-invalid={!!errors.sku}
                            maxLength={11}
                        />
                    </FormField>

                    <FormField label="Ціна" htmlFor="price" required error={errors.price}>
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
                            aria-invalid={!!errors.price}
                        />
                    </FormField>

                    <FormField label="Кількість на складі" htmlFor="inventory" required={!isInfinite} error={errors.inventory}>
                        <Input
                            id="inventory"
                            type="number"
                            min="0"
                            value={isInfinite ? "" : formData.inventory === -1 ? "" : formData.inventory}
                            onChange={(e) => {
                                const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                                setFormData({ ...formData, inventory: isNaN(value) ? 0 : value })
                                if (errors.inventory) {
                                    setErrors({ ...errors, inventory: undefined })
                                }
                            }}
                            placeholder="Введіть кількість товару на складі"
                            disabled={isLoading || isInfinite}
                            aria-invalid={!!errors.inventory}
                        />
                        <div className="flex items-center gap-2.5 pt-0.5">
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
                            <Label htmlFor="isInfinite" variant="inline" className="cursor-pointer">
                                Необмежена кількість на складі
                            </Label>
                        </div>
                    </FormField>
                </div>

                <FormField label="Категорії" required error={errors.categoryIds}>
                    <div className="flex flex-wrap gap-2.5">
                        {selectedCategories.map((category) => (
                            <Chip
                                key={category.categoryId}
                                onRemove={() => handleRemoveCategory(category.categoryId)}
                                disabled={isLoading}
                            >
                                {category.name}
                            </Chip>
                        ))}
                        <AddChip onClick={() => setCategoryDialogOpen(true)} disabled={isLoading}>
                            + Додати
                        </AddChip>
                    </div>
                </FormField>
            </FormShell>

            <CategorySelectionDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                onConfirm={handleCategorySelection}
                initialCategoryIds={selectedCategories.map((c) => c.categoryId)}
                kind="PRODUCT"
            />
        </>
    )
}
