"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { Member } from "@/components/members/types/member"
import { z } from "zod"
import { memberUpdateSchema, type MemberUpdateFormData } from "@/components/members/types/validations/member-validation"
import { updateMember } from "@/components/members/api/api"
import { toast } from "sonner"

interface MemberEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: Member | null
    onSuccess: () => void
}

export function MemberEditDialog({ open, onOpenChange, member, onSuccess }: MemberEditDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<MemberUpdateFormData>({
        firstName: null,
        lastName: null,
    })
    const [errors, setErrors] = useState<Partial<Record<keyof MemberUpdateFormData, string>>>({})

    useEffect(() => {
        if (member) {
            setFormData({
                firstName: member.firstName || null,
                lastName: member.lastName || null,
            })
            setErrors({})
        }
    }, [member])

    const validateForm = (): boolean => {
        try {
            memberUpdateSchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof MemberUpdateFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof MemberUpdateFormData] = err.message
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
            await updateMember(member.memberId, formData)
            toast.success("Профіль учасника оновлено")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating member:", error)
            toast.error("Помилка при оновленні профілю")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Редагувати профіль учасника</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">
                            Ім'я <span className="text-destructive">*</span>
                        </Label>
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
                        <Label htmlFor="lastName">
                            Прізвище <span className="text-destructive">*</span>
                        </Label>
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

                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Інформація про учасника</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                                <span className="font-medium">Телефон:</span> {member?.phone}
                            </p>
                            <p>
                                <span className="font-medium">Баланс балів:</span> {member?.pointsBalance}
                            </p>
                            <p>
                                <span className="font-medium">Рівень:</span> {member?.levelId}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" className="cursor-pointer" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Скасувати
                        </Button>
                        <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Зберегти
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
