"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { Member } from "@/components/members/types/member"
import { z } from "zod"
import {
    pointsAdjustmentSchema,
    type PointsAdjustmentFormData,
} from "@/components/members/types/validations/member-validation"
import { adjustMemberPoints } from "@/components/members/api/api"
import { toast } from "sonner"

interface PointsAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: Member | null
    onSuccess: () => void
}

export function PointsAdjustmentDialog({ open, onOpenChange, member, onSuccess }: PointsAdjustmentDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<PointsAdjustmentFormData>({
        points: 0,
        reason: "",
    })
    const [errors, setErrors] = useState<Partial<Record<keyof PointsAdjustmentFormData, string>>>({})

    useEffect(() => {
        if (open) {
            setFormData({ points: 0, reason: "" })
            setErrors({})
        }
    }, [open])

    const validateForm = (): boolean => {
        try {
            pointsAdjustmentSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof PointsAdjustmentFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof PointsAdjustmentFormData] = err.message
                    }
                })
                setErrors(newErrors)
            }
            return false
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!member || !validateForm()) {
            return
        }

        setIsLoading(true)
        try {
            await adjustMemberPoints(member.memberId, formData.points, formData.reason)
            toast.success("Бали учасника оновлено")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error("Error adjusting points:", error)
            const errorMessage = error?.response?.data?.message || "Помилка при зміні балів"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const newBalance = (member?.pointsBalance || 0) + formData.points

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Змінити бали учасника</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Учасник</p>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="font-medium">Ім'я:</span> {member?.firstName} {member?.lastName}
                            </p>
                            <p>
                                <span className="font-medium">Поточний баланс:</span> {member?.pointsBalance} балів
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="points">
                            Зміна балів <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="points"
                            type="number"
                            value={formData.points}
                            onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 0
                                setFormData({ ...formData, points: value })
                                if (errors.points) {
                                    setErrors({ ...errors, points: undefined })
                                }
                            }}
                            placeholder="Введіть кількість балів (+ або -)"
                            disabled={isLoading}
                            className={errors.points ? "border-destructive" : ""}
                        />
                        {errors.points && <p className="text-sm text-destructive">{errors.points}</p>}
                        <p className="text-sm text-muted-foreground">
                            Використовуйте додатні числа для додавання балів, від'ємні для віднімання
                        </p>
                    </div>

                    {formData.points !== 0 && (
                        <div className={`p-3 rounded-lg ${newBalance >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                            <p className="text-sm font-medium">
                                Новий баланс:{" "}
                                <span className={newBalance >= 0 ? "text-primary" : "text-destructive"}>{newBalance} балів</span>
                            </p>
                            {newBalance < 0 && <p className="text-sm text-destructive mt-1">Баланс не може бути від'ємним</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Причина зміни <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => {
                                setFormData({ ...formData, reason: e.target.value })
                                if (errors.reason) {
                                    setErrors({ ...errors, reason: undefined })
                                }
                            }}
                            placeholder="Опишіть причину зміни балів"
                            disabled={isLoading}
                            className={errors.reason ? "border-destructive" : ""}
                            rows={4}
                        />
                        {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
                        <p className="text-sm text-muted-foreground">Ця примітка буде збережена в історії змін</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Скасувати
                        </Button>
                        <Button type="submit" className="cursor-pointer" disabled={isLoading || newBalance < 0 || formData.points === 0 || !formData.reason.trim() || !formData.reason.length > 1000}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Зберегти
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
