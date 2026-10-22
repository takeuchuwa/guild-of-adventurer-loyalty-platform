"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { AiTextarea } from "@/components/ui/ai-textarea"
import { FormActions, FormField, FormShell } from "@/components/shared/form-shell"
import type { Game } from "./types/game"
import { z } from "zod"
import {type GameFormData, gameSchema} from "@/components/games/types/validations/game.ts";

interface GameFormProps {
    initialData?: Game
    onSubmit: (data: GameFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
    /** Edit screens title the page with the game's own name. */
    title?: string
    description?: string
}

export function GameForm({ initialData, onSubmit, onCancel, isLoading = false, mode, title, description }: GameFormProps) {
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
        <FormShell
            title={title ?? (mode === "create" ? "Створити ігрову систему" : "Редагувати ігрову систему")}
            description={
                description ?? (mode === "create" ? "Заповніть форму для створення нової ігрової системи" : "Оновіть назву та опис ігрової системи")
            }
            onSubmit={handleSubmit}
            actions={<FormActions mode={mode} isLoading={isLoading} onCancel={onCancel} />}
        >
            <FormField label="Назва ігрової системи" htmlFor="name" required error={errors.name}>
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
                    aria-invalid={!!errors.name}
                />
            </FormField>

            <FormField label="Опис" htmlFor="description" error={errors.description}>
                <AiTextarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value })
                        if (errors.description) {
                            setErrors({ ...errors, description: undefined })
                        }
                    }}
                    placeholder="Опис ігрової системи (необов'язково)"
                    disabled={isLoading}
                    rows={4}
                    entityType="game"
                    entityName={formData.name}
                    aria-invalid={!!errors.description}
                />
            </FormField>
        </FormShell>
    )
}
