import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { System } from "@/components/games/systems/types/system"
import { z } from "zod"
import { type SystemFormData, systemSchema } from "@/components/games/systems/types/validations/system.ts";

interface SystemFormProps {
    mode: "create" | "edit"
    initialData?: System
    onSubmit: (data: SystemFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export function SystemForm({ mode, initialData, onSubmit, onCancel, isLoading = false }: SystemFormProps) {
    const [formData, setFormData] = useState<SystemFormData>({
        name: "",
        description: "",
    })
    const [errors, setErrors] = useState<Partial<Record<keyof SystemFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                description: initialData.description || "",
            })
        }
    }, [initialData])

    const validate = () => {
        try {
            systemSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof SystemFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof SystemFormData] = err.message
                    }
                })
                setErrors(newErrors)
            }
            return false
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        await onSubmit({
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">
                    Назва <span className="text-destructive">*</span>
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
                    placeholder="Введіть назву редакції/правил"
                    disabled={isLoading}
                    className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Введіть опис редакції/правил"
                    disabled={isLoading}
                    rows={4}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="cursor-pointer">
                    Скасувати
                </Button>
                <Button type="submit" disabled={isLoading} className="cursor-pointer">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
            </div>
        </form>
    )
}
