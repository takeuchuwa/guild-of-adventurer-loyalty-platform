"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface PointsAdjustmentWarningDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export function PointsAdjustmentWarningDialog({ open, onOpenChange, onConfirm }: PointsAdjustmentWarningDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <DialogTitle>Попередження про зміну балів</DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="space-y-3 text-base">
                    <p>
                        Зміна балів учасника напряму може вплинути на його рівень і має використовуватися лише у виняткових
                        випадках.
                    </p>
                    <p className="font-semibold text-foreground">Використовуйте цю функцію тільки для:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Виправлення помилок у системі</li>
                        <li>Невідновлюваних ситуацій</li>
                        <li>Коригування балансу за рішенням адміністрації</li>
                    </ul>
                    <p className="text-destructive font-medium">Всі зміни балів записуються в історію з вашою приміткою.</p>
                </DialogDescription>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Скасувати
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm()
                            onOpenChange(false)
                        }}
                    >
                        Я розумію, продовжити
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
