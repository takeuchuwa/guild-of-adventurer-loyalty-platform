"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ProductSelectionDialog } from "@/components/shared/dialogs/product-selection-dialog"
import { ActivitySelectionDialog } from "@/components/shared/dialogs/activity-selection-dialog"
import { Package, CalendarDays, X } from "lucide-react"

export function EffectsSection() {
    const { watch, setValue, formState: { errors } } = useFormContext()

    const priceEffect = watch("config.effects.price")
    const pointsEffect = watch("config.effects.points")
    const inventoryEffect = watch("config.effects.inventory")

    const priceType = priceEffect?.type || "none"
    const pointsType = pointsEffect?.type || "none"
    const hasFreeItem = inventoryEffect !== undefined && inventoryEffect !== null

    const [freeItemEnabled, setFreeItemEnabled] = useState(hasFreeItem)
    const [productDialogOpen, setProductDialogOpen] = useState(false)
    const [activityDialogOpen, setActivityDialogOpen] = useState(false)

    // The .refine() error on config.effects lands here
    const effectsError = (errors?.config as any)?.effects?.root?.message
        || (errors?.config as any)?.effects?.message

    const handleProductConfirm = (productId: string, productName: string) => {
        setValue("config.effects.inventory", {
            type: "product",
            itemId: productId,
            itemName: productName,
        }, { shouldDirty: true })
    }

    const handleActivityConfirm = (activityId: string, activityName: string) => {
        setValue("config.effects.inventory", {
            type: "activity",
            itemId: activityId,
            itemName: activityName,
        }, { shouldDirty: true })
    }

    const handleRemoveFreeItem = () => {
        setValue("config.effects.inventory", undefined, { shouldDirty: true })
    }

    const handleFreeItemCheckChange = (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setFreeItemEnabled(true)
        } else {
            setFreeItemEnabled(false)
            setValue("config.effects.inventory", undefined, { shouldDirty: true })
        }
    }

    return (
        <div>
            <p className="text-sm text-muted-foreground mb-2">
                Оберіть, що отримає клієнт при застосуванні промоакції
            </p>
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5 mb-4 flex items-center gap-1.5">
                <span>💡</span>
                <span>Можна обрати декілька ефектів одночасно — наприклад, знижку і бонусні бали</span>
            </p>

            {effectsError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">{effectsError}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Group 1: Price Adjustments */}
                <div className={`border rounded-lg transition-colors ${priceType !== "none" ? "bg-green-50/30 border-green-200 border-l-4 border-l-green-400 shadow-sm" : "bg-muted/20"}`}>
                    <div className="p-4 flex items-center space-x-3">
                        <Checkbox
                            id="enable-price"
                            checked={priceType !== "none"}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    setValue("config.effects.price", { type: "percentage", value: 10 })
                                } else {
                                    setValue("config.effects.price", undefined)
                                }
                            }}
                            className="cursor-pointer h-5 w-5"
                        />
                        <Label htmlFor="enable-price" className="font-semibold cursor-pointer text-base">
                            Знижка на ціну
                        </Label>
                    </div>

                    {priceType !== "none" && (
                        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50">
                            <RadioGroup
                                value={priceType}
                                onValueChange={(value) => {
                                    if (value === "percentage") {
                                        setValue("config.effects.price", { type: "percentage", value: 10 })
                                    } else if (value === "fixed") {
                                        setValue("config.effects.price", { type: "fixed", value: 0 })
                                    } else if (value === "override") {
                                        setValue("config.effects.price", { type: "override", value: 0 })
                                    }
                                }}
                                className="space-y-4 mt-2"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="percentage" id="price-percentage" className="cursor-pointer" />
                                        <Label htmlFor="price-percentage" className="font-medium cursor-pointer">
                                            Відсоток знижки
                                        </Label>
                                    </div>
                                    {priceType === "percentage" && (
                                        <div className="ml-6 flex items-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={priceEffect?.value || 0}
                                                onChange={(e) =>
                                                    setValue("config.effects.price.value", Number(e.target.value))
                                                }
                                                className="w-24 bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">% знижки</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="fixed" id="price-fixed" className="cursor-pointer" />
                                        <Label htmlFor="price-fixed" className="font-medium cursor-pointer">
                                            Фіксована сума
                                        </Label>
                                    </div>
                                    {priceType === "fixed" && (
                                        <div className="ml-6 flex items-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={priceEffect?.value || 0}
                                                onChange={(e) =>
                                                    setValue("config.effects.price.value", Number(e.target.value))
                                                }
                                                className="w-32 bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">грн знижки на кошик</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="override" id="price-override" className="cursor-pointer" />
                                        <Label htmlFor="price-override" className="font-medium cursor-pointer">
                                            Фіксована ціна
                                        </Label>
                                    </div>
                                    {priceType === "override" && (
                                        <div className="ml-6 flex items-center gap-2 mt-2">
                                            <span className="text-sm text-muted-foreground">Встановити ціну підходящих товарів на</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={priceEffect?.value || 0}
                                                onChange={(e) =>
                                                    setValue("config.effects.price.value", Number(e.target.value))
                                                }
                                                className="w-32 bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">грн</span>
                                        </div>
                                    )}
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>

                {/* Group 2: Loyalty Rewards */}
                <div className={`border rounded-lg transition-colors ${pointsType !== "none" ? "bg-blue-50/30 border-blue-200 border-l-4 border-l-blue-400 shadow-sm" : "bg-muted/20"}`}>
                    <div className="p-4 flex items-center space-x-3">
                        <Checkbox
                            id="enable-points"
                            checked={pointsType !== "none"}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    setValue("config.effects.points", { type: "multiplier", value: 2 })
                                } else {
                                    setValue("config.effects.points", undefined)
                                }
                            }}
                            className="cursor-pointer h-5 w-5"
                        />
                        <Label htmlFor="enable-points" className="font-semibold cursor-pointer text-base">
                            Бонус балами
                        </Label>
                    </div>

                    {pointsType !== "none" && (
                        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50">
                            <RadioGroup
                                value={pointsType}
                                onValueChange={(value) => {
                                    if (value === "multiplier") {
                                        setValue("config.effects.points", { type: "multiplier", value: 2 })
                                    } else if (value === "bonus") {
                                        setValue("config.effects.points", { type: "bonus", value: 0 })
                                    }
                                }}
                                className="space-y-4 mt-2"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="multiplier" id="points-multiplier" className="cursor-pointer" />
                                        <Label htmlFor="points-multiplier" className="font-medium cursor-pointer">
                                            Множник балів
                                        </Label>
                                    </div>
                                    {pointsType === "multiplier" && (
                                        <div className="ml-6 flex items-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={pointsEffect?.value || 1}
                                                onChange={(e) =>
                                                    setValue("config.effects.points.value", Number(e.target.value))
                                                }
                                                className="w-24 bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">рази більше балів</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="bonus" id="points-bonus" className="cursor-pointer" />
                                        <Label htmlFor="points-bonus" className="font-medium cursor-pointer">
                                            Бонусні бали
                                        </Label>
                                    </div>
                                    {pointsType === "bonus" && (
                                        <div className="ml-6 flex items-center gap-2 mt-2">
                                            <span className="text-sm text-muted-foreground">+</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={pointsEffect?.value || 0}
                                                onChange={(e) =>
                                                    setValue("config.effects.points.value", Number(e.target.value))
                                                }
                                                className="w-24 bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">балів</span>
                                        </div>
                                    )}
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>

                {/* Group 3: Free Item — teaser only, feature not yet implemented */}
                <div className="border border-dashed rounded-lg px-4 py-3 bg-muted/5 flex items-center gap-2 text-muted-foreground">
                    <span>🎁</span>
                    <span className="text-sm">Безкоштовний бонус</span>
                    <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded ml-auto">
                        Скоро
                    </span>
                </div>
            </div>

            {/* Product Selection Dialog */}
            <ProductSelectionDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                onConfirm={handleProductConfirm}
            />

            {/* Activity Selection Dialog */}
            <ActivitySelectionDialog
                open={activityDialogOpen}
                onOpenChange={setActivityDialogOpen}
                onConfirm={handleActivityConfirm}
            />
        </div>
    )
}
