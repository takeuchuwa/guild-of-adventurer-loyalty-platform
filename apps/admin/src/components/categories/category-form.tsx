import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Category } from "@/components/categories/types/category-types.tsx"
import { z } from "zod"
import {type CategoryFormData, categorySchema} from "@/components/categories/types/validations/category-validation.ts";

interface CategoryFormProps {
    initialData?: Category
    onSubmit: (data: CategoryFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
}

export function CategoryForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: CategoryFormProps) {
    const [formData, setFormData] = useState<CategoryFormData>({
        name: initialData?.name || "",
        kind: initialData?.kind || "PRODUCT",
    })

    const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                kind: initialData.kind,
            })
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            categorySchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof CategoryFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof CategoryFormData] = err.message
                    }
                })
                setErrors(newErrors)
            }
            return false
        }
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
                        Назва категорії <span className="text-destructive">*</span>
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
                        placeholder="Введіть назву категорії"
                        disabled={isLoading}
                        className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="kind">
                        Тип категорії <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.kind}
                        onValueChange={(value: "PRODUCT" | "ACTIVITY") => {
                            setFormData({ ...formData, kind: value })
                            if (errors.kind) {
                                setErrors({ ...errors, kind: undefined })
                            }
                        }}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="kind" className={errors.kind ? "border-destructive" : ""}>
                            <SelectValue placeholder="Оберіть тип категорії" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PRODUCT">Продукт</SelectItem>
                            <SelectItem value="ACTIVITY">Активність</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.kind && <p className="text-sm text-destructive">{errors.kind}</p>}
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <Button type="button" className="cursor-pointer" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Скасувати
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
            </div>
        </form>
    )
}
