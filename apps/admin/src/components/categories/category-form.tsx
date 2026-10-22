import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormActions, FormField, FormShell } from "@/components/shared/form-shell"
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
        <FormShell
            title={mode === "create" ? "Створити категорію" : "Редагувати категорію"}
            description={mode === "create" ? "Заповніть форму для створення нової категорії" : "Оновіть інформацію про категорію"}
            onSubmit={handleSubmit}
            actions={<FormActions mode={mode} isLoading={isLoading} onCancel={onCancel} />}
        >
            <FormField label="Назва категорії" htmlFor="name" required error={errors.name}>
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
                    aria-invalid={!!errors.name}
                />
            </FormField>

            <FormField label="Тип категорії" htmlFor="kind" required error={errors.kind}>
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
                    <SelectTrigger id="kind" className="w-full max-w-[320px]" aria-invalid={!!errors.kind}>
                        <SelectValue placeholder="Оберіть тип категорії" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PRODUCT">Продукт</SelectItem>
                        <SelectItem value="ACTIVITY">Активність</SelectItem>
                    </SelectContent>
                </Select>
            </FormField>
        </FormShell>
    )
}
