"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { FormActions, FormField, FormShell } from "@/components/shared/form-shell"
import type { Room } from "./types/room"
import { z } from "zod"
import { type RoomFormData, roomSchema } from "./types/validations/room-validation"

interface RoomFormProps {
    initialData?: Room
    onSubmit: (data: RoomFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
}

export function RoomForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: RoomFormProps) {
    const [formData, setFormData] = useState<RoomFormData>({
        name: initialData?.name || "",
        color: initialData?.color || "#3b82f6",
    })

    const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                color: initialData.color,
            })
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            roomSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof RoomFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof RoomFormData] = err.message
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
            title={mode === "create" ? "Створити кімнату" : "Редагувати кімнату"}
            onSubmit={handleSubmit}
            actions={<FormActions mode={mode} isLoading={isLoading} onCancel={onCancel} />}
        >
            <FormField label="Назва кімнати" htmlFor="name" required error={errors.name}>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) {
                            setErrors({ ...errors, name: undefined })
                        }
                    }}
                    placeholder="Введіть назву кімнати"
                    disabled={isLoading}
                    aria-invalid={!!errors.name}
                />
            </FormField>

            <FormField
                label="Колір"
                htmlFor="color"
                required
                error={errors.color}
                hint="Колір буде використовуватися в календарі"
            >
                <div className="flex gap-2.5">
                    <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => {
                            setFormData({ ...formData, color: e.target.value })
                            if (errors.color) {
                                setErrors({ ...errors, color: undefined })
                            }
                        }}
                        disabled={isLoading}
                        className="w-20 p-1.5"
                        aria-invalid={!!errors.color}
                    />
                    <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith("#")) {
                                val = "#" + val;
                            }
                            if (val.startsWith("#")) {
                                val = "#" + val.slice(1).replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                            }
                            setFormData({ ...formData, color: val })
                            if (errors.color) {
                                setErrors({ ...errors, color: undefined })
                            }
                        }}
                        placeholder="#3b82f6"
                        disabled={isLoading}
                        className="max-w-[220px] font-mono"
                        aria-invalid={!!errors.color}
                    />
                </div>
            </FormField>
        </FormShell>
    )
}
