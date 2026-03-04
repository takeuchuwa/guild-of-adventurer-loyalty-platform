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
            <h4 className="font-semibold mb-2">Нагороди клієнта</h4>
            <p className="text-sm text-muted-foreground mb-4">
                Визначте нагороди, які отримає клієнт при застосуванні промоакції
            </p>

            {effectsError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">{effectsError}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Group 1: Price Adjustments */}
                <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-semibold mb-3">Знижка на ціну</h4>
                    <RadioGroup
                        value={priceType}
                        onValueChange={(value) => {
                            if (value === "none") {
                                setValue("config.effects.price", undefined)
                            } else if (value === "percentage") {
                                setValue("config.effects.price", {
                                    type: "percentage",
                                    value: 10,
                                })
                            } else if (value === "fixed") {
                                setValue("config.effects.price", {
                                    type: "fixed",
                                    value: 0,
                                })
                            } else if (value === "override") {
                                setValue("config.effects.price", {
                                    type: "override",
                                    value: 0,
                                })
                            }
                        }}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="price-none" className="cursor-pointer" />
                            <Label htmlFor="price-none" className="font-normal cursor-pointer">
                                Без знижки
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="price-percentage" className="cursor-pointer" />
                                <Label htmlFor="price-percentage" className="font-normal cursor-pointer">
                                    Відсоток знижки
                                </Label>
                            </div>
                            {priceType === "percentage" && (
                                <div className="ml-6 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={priceEffect?.value || 0}
                                        onChange={(e) =>
                                            setValue("config.effects.price.value", Number(e.target.value))
                                        }
                                        className="w-24"
                                    />
                                    <span className="text-sm">% знижки</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="price-fixed" className="cursor-pointer" />
                                <Label htmlFor="price-fixed" className="font-normal cursor-pointer">
                                    Фіксована сума
                                </Label>
                            </div>
                            {priceType === "fixed" && (
                                <div className="ml-6 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={priceEffect?.value || 0}
                                        onChange={(e) =>
                                            setValue("config.effects.price.value", Number(e.target.value))
                                        }
                                        className="w-32"
                                    />
                                    <span className="text-sm">грн знижки на кошик</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="override" id="price-override" className="cursor-pointer" />
                                <Label htmlFor="price-override" className="font-normal cursor-pointer">
                                    Фіксована ціна
                                </Label>
                            </div>
                            {priceType === "override" && (
                                <div className="ml-6 flex items-center gap-2">
                                    <span className="text-sm">Встановити ціну підходящих товарів на</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={priceEffect?.value || 0}
                                        onChange={(e) =>
                                            setValue("config.effects.price.value", Number(e.target.value))
                                        }
                                        className="w-32"
                                    />
                                    <span className="text-sm">грн</span>
                                </div>
                            )}
                        </div>
                    </RadioGroup>
                </div>

                {/* Group 2: Loyalty Rewards */}
                <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-semibold mb-3">Бали і лояльність</h4>
                    <RadioGroup
                        value={pointsType}
                        onValueChange={(value) => {
                            if (value === "none") {
                                setValue("config.effects.points", undefined)
                            } else if (value === "multiplier") {
                                setValue("config.effects.points", {
                                    type: "multiplier",
                                    value: 2,
                                })
                            } else if (value === "bonus") {
                                setValue("config.effects.points", {
                                    type: "bonus",
                                    value: 0,
                                })
                            }
                        }}
                        className="space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="points-none" className="cursor-pointer" />
                            <Label htmlFor="points-none" className="font-normal cursor-pointer">
                                Без додаткових балів
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="multiplier" id="points-multiplier" className="cursor-pointer" />
                                <Label htmlFor="points-multiplier" className="font-normal cursor-pointer">
                                    Множник балів
                                </Label>
                            </div>
                            {pointsType === "multiplier" && (
                                <div className="ml-6 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.1"
                                        value={pointsEffect?.value || 1}
                                        onChange={(e) =>
                                            setValue("config.effects.points.value", Number(e.target.value))
                                        }
                                        className="w-24"
                                    />
                                    <span className="text-sm">× множник балів</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bonus" id="points-bonus" className="cursor-pointer" />
                                <Label htmlFor="points-bonus" className="font-normal cursor-pointer">
                                    Бонусні бали
                                </Label>
                            </div>
                            {pointsType === "bonus" && (
                                <div className="ml-6 flex items-center gap-2">
                                    <span className="text-sm">+</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={pointsEffect?.value || 0}
                                        onChange={(e) =>
                                            setValue("config.effects.points.value", Number(e.target.value))
                                        }
                                        className="w-24"
                                    />
                                    <span className="text-sm">балів</span>
                                </div>
                            )}
                        </div>
                    </RadioGroup>
                </div>

                {/* Group 3: Free Item */}
                <div className="border rounded-lg p-4 bg-muted/10 opacity-70">
                    <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold">Безкоштовний бонус</h4>
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            В розробці
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="free-item"
                                checked={freeItemEnabled}
                                onCheckedChange={handleFreeItemCheckChange}
                                disabled
                                className="cursor-not-allowed"
                            />
                            <Label htmlFor="free-item" className="cursor-not-allowed text-muted-foreground">
                                Додати безкоштовний бонус
                            </Label>
                        </div>

                        {/* Show selected item badge OR pick buttons */}
                        {hasFreeItem && inventoryEffect?.itemId && (
                            <div className="ml-6">
                                <Label className="text-sm text-muted-foreground mb-2 block">Обраний бонус</Label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm">
                                    {inventoryEffect.type === "product" ? (
                                        <Package className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <CalendarDays className="h-4 w-4 shrink-0" />
                                    )}
                                    <span className="font-medium">
                                        {inventoryEffect.type === "product" ? "Товар" : "Сесія"}:
                                    </span>
                                    <span>{inventoryEffect.itemName || inventoryEffect.itemId}</span>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFreeItem}
                                        className="ml-auto hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Show buttons when checkbox is on but no item is picked yet */}
                        {freeItemEnabled && !inventoryEffect?.itemId && (
                            <div className="ml-6 flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProductDialogOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Обрати товар
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActivityDialogOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Обрати сесію
                                </Button>
                            </div>
                        )}
                    </div>
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
