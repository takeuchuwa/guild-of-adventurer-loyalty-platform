import type React from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ActivitySelectionDialog } from "@/components/shared/dialogs/activity-selection-dialog"
import { CalendarDays, Loader2, X } from "lucide-react"
import type { DonationPayload } from "@/components/checkout/types/checkout"
import { DONATION_PREFIX } from "@/lib/donation"
const DEFAULT_POINTS_PERCENT = 10
const MAX_LABEL_LENGTH = 80

interface DonationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Points only land on a member; without one the donation is a till line only. */
    hasMember: boolean
    onSubmit: (payload: DonationPayload) => Promise<unknown>
}

export function DonationDialog({ open, onOpenChange, hasMember, onSubmit }: DonationDialogProps) {
    const [label, setLabel] = useState("")
    const [amount, setAmount] = useState("")
    const [pointsPercent, setPointsPercent] = useState(String(DEFAULT_POINTS_PERCENT))
    const [activity, setActivity] = useState<{ id: string; name: string } | null>(null)
    const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ label?: string; amount?: string; pointsPercent?: string }>({})

    useEffect(() => {
        if (open) {
            setLabel("")
            setAmount("")
            setPointsPercent(String(DEFAULT_POINTS_PERCENT))
            setActivity(null)
            setErrors({})
        }
    }, [open])

    const amountValue = Number.parseFloat(amount.replace(",", "."))
    const percentValue = Number.parseFloat(pointsPercent.replace(",", "."))
    const previewPoints =
        Number.isFinite(amountValue) && amountValue > 0 && Number.isFinite(percentValue) && percentValue >= 0
            ? Math.floor((amountValue * percentValue) / 100)
            : 0

    const validate = () => {
        const next: typeof errors = {}
        if (!label.trim()) next.label = "Вкажіть назву донату"
        if (!Number.isFinite(amountValue) || amountValue <= 0) next.amount = "Сума має бути більшою за 0"
        if (!Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) next.pointsPercent = "Від 0 до 100%"
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            await onSubmit({
                label: label.trim(),
                amount: Math.round(amountValue * 100) / 100,
                pointsPercent: percentValue,
                activityId: activity?.id ?? null,
            })
            onOpenChange(false)
        } catch {
            // The cart hook already surfaced the error as a toast; keep the form for a retry.
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Донат</DialogTitle>
                        <DialogDescription>
                            Довільна сума від гостя. Бали нараховуються учаснику у кошику після закриття каси.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="donation-label">
                                Назва <span className="text-destructive">*</span>
                            </Label>
                            <div
                                className={`flex items-center border bg-transparent focus-within:border-primary ${errors.label ? "border-destructive" : "border-[rgba(237,230,216,.18)]"}`}
                            >
                                <span className="text-accent-bright font-heading shrink-0 pl-3 text-[13px] font-semibold uppercase tracking-[.08em]">
                                    {DONATION_PREFIX.trim()}
                                </span>
                                <Input
                                    id="donation-label"
                                    autoFocus
                                    value={label}
                                    maxLength={MAX_LABEL_LENGTH}
                                    onChange={(e) => {
                                        setLabel(e.target.value)
                                        if (errors.label) setErrors({ ...errors, label: undefined })
                                    }}
                                    placeholder="вечір Ктулху"
                                    disabled={isSubmitting}
                                    className="border-0 shadow-none focus-visible:ring-0"
                                />
                            </div>
                            {errors.label && <p className="text-destructive text-sm">{errors.label}</p>}
                        </div>

                        <div className="grid grid-cols-[1fr_8rem] gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="donation-amount">
                                    Сума, грн <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="donation-amount"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value)
                                        if (errors.amount) setErrors({ ...errors, amount: undefined })
                                    }}
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                    className={`font-mono ${errors.amount ? "border-destructive" : ""}`}
                                />
                                {errors.amount && <p className="text-destructive text-sm">{errors.amount}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="donation-percent">% у бали</Label>
                                <Input
                                    id="donation-percent"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={100}
                                    step="1"
                                    value={pointsPercent}
                                    onChange={(e) => {
                                        setPointsPercent(e.target.value)
                                        if (errors.pointsPercent) setErrors({ ...errors, pointsPercent: undefined })
                                    }}
                                    disabled={isSubmitting}
                                    className={`font-mono ${errors.pointsPercent ? "border-destructive" : ""}`}
                                />
                                {errors.pointsPercent && <p className="text-destructive text-sm">{errors.pointsPercent}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Подія (необов'язково)</Label>
                            {activity ? (
                                <div className="flex items-center justify-between gap-3 border border-[rgba(201,158,58,.22)] px-3 py-2">
                                    <span className="flex min-w-0 items-center gap-2 text-[14px]">
                                        <CalendarDays className="text-accent-bright h-4 w-4 shrink-0" />
                                        <span className="truncate">{activity.name}</span>
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Прибрати подію"
                                        onClick={() => setActivity(null)}
                                        disabled={isSubmitting}
                                        className="text-foreground/60 hover:text-foreground cursor-pointer transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsActivityPickerOpen(true)}
                                    disabled={isSubmitting}
                                    className="w-full cursor-pointer justify-start"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Обрати подію
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4 border border-[rgba(201,158,58,.22)] px-3 py-2.5 text-[13.5px]">
                            <span className="text-foreground/65">Буде нараховано</span>
                            <span className="text-accent-bright font-mono font-semibold">+{previewPoints} XP</span>
                        </div>
                        {!hasMember && (
                            <p className="text-muted-foreground text-[12.5px]">
                                Учасника не обрано — донат буде проведено без нарахування балів.
                            </p>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="cursor-pointer">
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Додати в кошик
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ActivitySelectionDialog
                open={isActivityPickerOpen}
                onOpenChange={setIsActivityPickerOpen}
                initialActivityIds={activity ? [activity.id] : []}
                onConfirm={(activityId, activityName) => {
                    setActivity({ id: activityId, name: activityName })
                    setIsActivityPickerOpen(false)
                }}
            />
        </>
    )
}
