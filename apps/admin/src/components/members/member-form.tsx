"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Member } from "@/components/members/types/member"
import { z } from "zod"
import { PointsAdjustmentWarningDialog } from "@/components/shared/dialogs/points-adjustment-warning-dialog"
import { PointsAdjustmentDialog } from "@/components/shared/dialogs/points-adjustment-dialog"

const memberFormSchema = z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
})

export type MemberFormData = z.infer<typeof memberFormSchema>

interface MemberFormProps {
    initialData: Member
    onSubmit: (data: MemberFormData) => Promise<void>
    onCancel: () => void
    onPointsAdjusted?: () => Promise<void>
    isLoading?: boolean
}

export function MemberForm({ initialData, onSubmit, onCancel, onPointsAdjusted, isLoading = false }: MemberFormProps) {
    const [warningDialogOpen, setWarningDialogOpen] = useState(false)
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false)

    const [formData, setFormData] = useState<MemberFormData>({
        firstName: initialData?.firstName || null,
        lastName: initialData?.lastName || null,
    })

    const [errors, setErrors] = useState<Partial<Record<keyof MemberFormData, string>>>({})

    useEffect(() => {
        if (initialData) {
            setFormData({
                firstName: initialData.firstName || null,
                lastName: initialData.lastName || null,
            })
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            memberFormSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof MemberFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof MemberFormData] = err.message
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

    const handleWarningConfirm = () => {
        setWarningDialogOpen(false)
        setPointsDialogOpen(true)
    }

    const handlePointsAdjusted = async () => {
        setPointsDialogOpen(false)
        if (onPointsAdjusted) {
            await onPointsAdjusted()
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Read-only member information */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-sm text-muted-foreground">Інформація про учасника</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ID учасника</Label>
                            <p className="text-sm font-mono">{initialData.memberId}</p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Телефон</Label>
                            <p className="text-sm">{initialData.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Баланс балів</Label>
                            <p className="text-sm font-semibold">{initialData.pointsBalance}</p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Рівень</Label>
                            <p className="text-sm">{initialData.levelId}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Дата приєднання</Label>
                            <p className="text-sm">{new Date(initialData.joinedAt * 1000).toLocaleDateString("uk-UA")}</p>
                        </div>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Ім'я</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName || ""}
                            onChange={(e) => {
                                setFormData({ ...formData, firstName: e.target.value || null })
                                if (errors.firstName) {
                                    setErrors({ ...errors, firstName: undefined })
                                }
                            }}
                            placeholder="Введіть ім'я"
                            disabled={isLoading}
                            className={errors.firstName ? "border-destructive" : ""}
                        />
                        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Прізвище</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName || ""}
                            onChange={(e) => {
                                setFormData({ ...formData, lastName: e.target.value || null })
                                if (errors.lastName) {
                                    setErrors({ ...errors, lastName: undefined })
                                }
                            }}
                            placeholder="Введіть прізвище"
                            disabled={isLoading}
                            className={errors.lastName ? "border-destructive" : ""}
                        />
                        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                </div>

                {/* Points adjustment button */}
                <div className="pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setWarningDialogOpen(true)}
                        disabled={isLoading}
                        className="w-full"
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Змінити бали учасника
                    </Button>
                </div>

                {/* Form actions */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" className="cursor-pointer" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Скасувати
                    </Button>
                    <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Зберегти
                    </Button>
                </div>
            </form>

            <PointsAdjustmentWarningDialog
                open={warningDialogOpen}
                onOpenChange={setWarningDialogOpen}
                onConfirm={handleWarningConfirm}
            />

            <PointsAdjustmentDialog
                open={pointsDialogOpen}
                onOpenChange={setPointsDialogOpen}
                member={initialData}
                onSuccess={handlePointsAdjusted}
            />
        </>
    )
}
