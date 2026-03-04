"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { Game } from "./types/game"
import { z } from "zod"
import {type GameFormData, gameSchema} from "@/components/games/types/validations/game.ts";

interface GameFormProps {
    initialData?: Game
    onSubmit: (data: GameFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
}

export function GameForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: GameFormProps) {
    const [formData, setFormData] = useState<GameFormData>({
        name: initialData?.name || "",
        description: initialData?.description || "",
    })

    const [errors, setErrors] = useState<Partial<Record<keyof GameFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || "",
            })
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            gameSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof GameFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof GameFormData] = err.message
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
            await onSubmit({
                name: formData.name.trim(),
                description: formData.description?.trim() || undefined,
            })
        } catch (error) {
            console.error("Form submission error:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Назва гри <span className="text-destructive">*</span>
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
                        placeholder="Наприклад: D&D, Pathfinder"
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
                        placeholder="Опис гри (необов'язково)"
                        disabled={isLoading}
                        rows={4}
                    />
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
