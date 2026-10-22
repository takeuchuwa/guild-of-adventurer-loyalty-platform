import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeleteConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    itemName?: string
    itemCount?: number
}

export function DeleteConfirmationDialog({
                                             open,
                                             onOpenChange,
                                             onConfirm,
                                             title,
                                             description,
                                             itemName,
                                             itemCount,
                                         }: DeleteConfirmationDialogProps) {
    const [confirmText, setConfirmText] = useState("")
    const isValid = confirmText === "видалити"

    const handleConfirm = () => {
        if (isValid) {
            onConfirm()
            setConfirmText("")
            onOpenChange(false)
        }
    }

    const handleCancel = () => {
        setConfirmText("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {itemCount && itemCount > 1 ? (
                    <div>
                        <p className="text-sm font-medium">
                            Ви збираєтесь видалити: <span className="font-bold">{itemCount} елементів</span>
                        </p>
                    </div>
                ) : itemName ? (
                    <div>
                        <p className="text-sm font-medium">
                            Ви збираєтесь видалити: <span className="font-bold">{itemName}</span>
                        </p>
                    </div>
                ) : null}
                <div className="space-y-2 items-center">
                    <Label htmlFor="confirm-text">
                        Введіть <span className="font-bold text-destructive">видалити</span> для підтвердження
                    </Label>
                    <Input
                        id="confirm-text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="видалити"
                        autoComplete="off"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} className="cursor-pointer">
                        Скасувати
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={!isValid} className="cursor-pointer">
                        Видалити
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

