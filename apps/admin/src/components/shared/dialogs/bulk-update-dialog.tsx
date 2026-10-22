"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface BulkUpdateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (data: { price?: number; overridePoints?: number | null }) => Promise<void>
    title: string
    description: string
    count: number
}

export function BulkUpdateDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    count,
}: BulkUpdateDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [updatePrice, setUpdatePrice] = useState(false)
    const [price, setPrice] = useState<number>(0)
    const [updatePoints, setUpdatePoints] = useState(false)
    const [pointsMode, setPointsMode] = useState<"set" | "clear">("set")
    const [points, setPoints] = useState<number>(0)

    useEffect(() => {
        if (open) {
            setUpdatePrice(false)
            setPrice(0)
            setUpdatePoints(false)
            setPointsMode("set")
            setPoints(0)
            setIsLoading(false)
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!updatePrice && !updatePoints) return

        setIsLoading(true)
        try {
            const data: { price?: number; overridePoints?: number | null } = {}
            if (updatePrice) {
                data.price = price
            }
            if (updatePoints) {
                data.overridePoints = pointsMode === "clear" ? null : points
            }
            await onConfirm(data)
            onOpenChange(false)
        } catch (error) {
            console.error("Error in bulk update confirm:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const isSubmitDisabled = (!updatePrice && !updatePoints) || isLoading

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Price updates */}
                        <div className="space-y-3 p-4 border rounded-lg bg-card text-card-foreground">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="update-price"
                                    checked={updatePrice}
                                    onCheckedChange={(checked) => setUpdatePrice(!!checked)}
                                />
                                <Label htmlFor="update-price" className="font-semibold cursor-pointer select-none">
                                    Оновити ціну
                                </Label>
                            </div>
                            {updatePrice && (
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="price-value">Нова ціна (₴)</Label>
                                    <Input
                                        id="price-value"
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={price}
                                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                        placeholder="Введіть ціну"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Points updates */}
                        <div className="space-y-3 p-4 border rounded-lg bg-card text-card-foreground">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="update-points"
                                    checked={updatePoints}
                                    onCheckedChange={(checked) => setUpdatePoints(!!checked)}
                                />
                                <Label htmlFor="update-points" className="font-semibold cursor-pointer select-none">
                                    Оновити бали (XP)
                                </Label>
                            </div>
                            {updatePoints && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">Режим зміни балів:</Label>
                                        <div className="flex items-center gap-6 mt-1">
                                            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                                                <input
                                                    type="radio"
                                                    name="pointsMode"
                                                    checked={pointsMode === "set"}
                                                    onChange={() => setPointsMode("set")}
                                                    className="w-4 h-4 text-primary accent-primary cursor-pointer"
                                                />
                                                <span>Встановити значення</span>
                                            </label>
                                            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                                                <input
                                                    type="radio"
                                                    name="pointsMode"
                                                    checked={pointsMode === "clear"}
                                                    onChange={() => setPointsMode("clear")}
                                                    className="w-4 h-4 text-primary accent-primary cursor-pointer"
                                                />
                                                <span>Скинути до стандартного</span>
                                            </label>
                                        </div>
                                    </div>

                                    {pointsMode === "set" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="points-value">Нові бали (XP)</Label>
                                            <Input
                                                id="points-value"
                                                type="number"
                                                min={0}
                                                value={points}
                                                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                placeholder="Введіть бали"
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="cursor-pointer">
                            Скасувати
                        </Button>
                        <Button type="submit" disabled={isSubmitDisabled} className="cursor-pointer">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Оновити ({count} шт.)
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
