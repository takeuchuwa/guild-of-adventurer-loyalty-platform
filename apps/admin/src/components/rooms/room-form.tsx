"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Назва кімнати <span className="text-destructive">*</span>
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
                        placeholder="Введіть назву кімнати"
                        disabled={isLoading}
                        className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="color">
                        Колір <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
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
                            className={`w-20 h-10 ${errors.color ? "border-destructive" : ""}`}
                        />
                        <Input
                            type="text"
                            value={formData.color}
                            onChange={(e) => {
                                setFormData({ ...formData, color: e.target.value })
                                if (errors.color) {
                                    setErrors({ ...errors, color: undefined })
                                }
                            }}
                            placeholder="#3b82f6"
                            disabled={isLoading}
                            className={errors.color ? "border-destructive" : ""}
                        />
                    </div>
                    {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
                    <p className="text-sm text-muted-foreground">Колір буде використовуватися в календарі</p>
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
