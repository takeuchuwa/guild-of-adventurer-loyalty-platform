"use client"

import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { CONDITION_OPTIONS, type ConditionType } from "./types/config"

import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"
import { ProductSelectionDialog } from "@/components/shared/dialogs/product-selection-dialog"
import { ActivitySelectionDialog } from "@/components/shared/dialogs/activity-selection-dialog"

export function ConditionsSection() {
    const { watch, setValue } = useFormContext()
    const [popoverOpen, setPopoverOpen] = useState(false)

    const conditions = watch("config.conditions") || {}

    // Helper to get the group name for a condition type
    const getGroupName = (type: ConditionType): "cartConditions" | "itemConditions" | "memberConditions" => {
        if (type === "cart_total" || type === "cart_item_count") return "cartConditions"
        if (type === "contains_category" || type === "contains_product" || type === "contains_activity")
            return "itemConditions"
        return "memberConditions"
    }

    const addCondition = (type: ConditionType) => {
        const groupName = getGroupName(type)
        const newConditions = { ...conditions }
        if (!newConditions[groupName]) {
            newConditions[groupName] = {}
        }

        // Initialize condition with default values
        switch (type) {
            case "cart_total":
                newConditions.cartConditions.cart_total = 0
                break
            case "cart_item_count":
                newConditions.cartConditions.cart_item_count = 0
                break
            case "contains_category":
            case "contains_product":
            case "contains_activity":
                newConditions.itemConditions[type] = {
                    mode: "include",
                    logic: "any",
                    values: [],
                }
                break
            case "member_is_new":
                newConditions.memberConditions.member_is_new = 30
                break
            case "max_usage_per_member":
                newConditions.memberConditions.max_usage_per_member = { limit: 1, period: "global" }
                break
            case "member_is_birthday":
                newConditions.memberConditions.member_is_birthday = 0
                break
        }

        setValue("config.conditions", newConditions)
        setPopoverOpen(false)
    }

    const removeCondition = (type: ConditionType) => {
        const groupName = getGroupName(type)
        const newConditions = { ...conditions }
        if (newConditions[groupName]) {
            delete newConditions[groupName][type]
            // Remove group if empty
            if (Object.keys(newConditions[groupName]).length === 0) {
                delete newConditions[groupName]
            }
        }
        setValue("config.conditions", newConditions)
    }

    const updateCondition = (type: ConditionType, value: any) => {
        const groupName = getGroupName(type)
        const newConditions = { ...conditions }
        if (!newConditions[groupName]) {
            newConditions[groupName] = {}
        }
        newConditions[groupName][type] = value
        setValue("config.conditions", newConditions)
    }

    // Flatten all conditions from all groups
    const activeConditions: ConditionType[] = []
    if (conditions.cartConditions) {
        activeConditions.push(...(Object.keys(conditions.cartConditions) as ConditionType[]))
    }
    if (conditions.itemConditions) {
        activeConditions.push(...(Object.keys(conditions.itemConditions) as ConditionType[]))
    }
    if (conditions.memberConditions) {
        activeConditions.push(...(Object.keys(conditions.memberConditions) as ConditionType[]))
    }

    // Helper to get the value for a condition
    const getConditionValue = (type: ConditionType) => {
        const groupName = getGroupName(type)
        return conditions[groupName]?.[type]
    }

    // Group conditions by category
    const groupedOptions = CONDITION_OPTIONS.reduce((acc, option) => {
        if (!acc[option.category]) {
            acc[option.category] = []
        }
        acc[option.category].push(option)
        return acc
    }, {} as Record<string, typeof CONDITION_OPTIONS>)

    // Helper to check if any condition from a category is already active
    const isCategoryActive = (category: string): boolean => {
        return activeConditions.some((activeType) => {
            const activeOption = CONDITION_OPTIONS.find((opt) => opt.type === activeType)
            return activeOption?.category === category
        })
    }

    return (
        <div>
            <h4 className="font-semibold mb-2">Всі повинні бути виконані</h4>
            <p className="text-sm text-muted-foreground mb-4">
                Визначте умови, що мають бути виконані для застосування промоакції
            </p>

            <div className="space-y-3 mb-4">
                {activeConditions.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                        Умови не додані. Натисніть "+ Додати умову" щоб почати
                    </div>
                )}

                {activeConditions.map((type) => {
                    const option = CONDITION_OPTIONS.find((opt) => opt.type === type)
                    if (!option) return null

                    return (
                        <ConditionRow
                            key={type}
                            type={type}
                            option={option}
                            value={getConditionValue(type)}
                            onUpdate={(value) => updateCondition(type, value)}
                            onRemove={() => removeCondition(type)}
                        />
                    )
                })}
            </div>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full cursor-pointer">
                        <Plus className="mr-2 h-4 w-6" />
                        Додати умову
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="start">
                    <div className="space-y-3">
                        {Object.entries(groupedOptions).map(([category, options]) => {
                            const categoryActive = isCategoryActive(category)
                            return (
                                <div key={category}>
                                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
                                    <div className="space-y-1">
                                        {options.map((option) => {
                                            const isCurrentlyActive = activeConditions.includes(option.type)
                                            const isDisabled = categoryActive && !isCurrentlyActive
                                            return (
                                                <Button
                                                    key={option.type}
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start text-sm cursor-pointer"
                                                    onClick={() => addCondition(option.type)}
                                                    disabled={isDisabled || isCurrentlyActive}
                                                >
                                                    <span className="mr-2">{option.icon}</span>
                                                    {option.label}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

interface ConditionRowProps {
    type: ConditionType
    option: (typeof CONDITION_OPTIONS)[number]
    value: any
    onUpdate: (value: any) => void
    onRemove: () => void
}

function ConditionRow({ type, option, value, onUpdate, onRemove }: ConditionRowProps) {
    return (
        <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-semibold">{option.label}</span>
                    </div>

                    {/* Render input based on condition type */}
                    {(type === "cart_total" || type === "cart_item_count") && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Мінімум:</Label>
                            <Input
                                type="number"
                                min="0"
                                value={value || 0}
                                onChange={(e) => onUpdate(Number(e.target.value))}
                                className="w-32"
                            />
                            {type === "cart_total" && <span className="text-sm text-muted-foreground">грн</span>}
                        </div>
                    )}

                    {(type === "contains_category" ||
                        type === "contains_product" ||
                        type === "contains_activity") && (
                            <ContainsItemCondition
                                type={type}
                                value={value}
                                onUpdate={onUpdate}
                            />
                        )}

                    {type === "member_is_new" && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Днів від реєстрації (не більше ніж):</Label>
                            <Input
                                type="number"
                                min="0"
                                value={value !== undefined ? value : 30}
                                onChange={(e) => onUpdate(Number(e.target.value))}
                                className="w-32"
                            />
                        </div>
                    )}

                    {type === "max_usage_per_member" && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-muted-foreground">Кількість використань (не більше ніж):</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={value?.limit || 1}
                                    onChange={(e) => onUpdate({ ...(value || {}), limit: Number(e.target.value) })}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">за період</span>
                                <select
                                    className="flex h-9 w-[180px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={value?.period || "global"}
                                    onChange={(e) => onUpdate({ ...(value || {}), period: e.target.value })}
                                >
                                    <option value="global">За весь час</option>
                                    <option value="year">За рік</option>
                                    <option value="month">За Місяць</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {type === "member_is_birthday" && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-foreground">
                                Діє протягом +/- днів від дня народження учасника
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={value || 0}
                                    onChange={(e) => onUpdate(Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">днів (0 = лише в день народження)</span>
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-destructive hover:text-destructive cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

interface ContainsItemConditionProps {
    type: "contains_category" | "contains_product" | "contains_activity"
    value: {
        mode: "include" | "exclude"
        logic: "any" | "all"
        values: string[]
    }
    onUpdate: (value: any) => void
}

function ContainsItemCondition({ type, value, onUpdate }: ContainsItemConditionProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [displayMap, setDisplayMap] = useState<Map<string, string>>(new Map())

    const updateField = (field: keyof typeof value, newValue: any) => {
        onUpdate({ ...value, [field]: newValue })
    }

    const removeValue = (itemId: string) => {
        onUpdate({ ...value, values: value.values.filter((id) => id !== itemId) })
        setDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(itemId)
            return next
        })
    }

    const handleConfirm = (entityMap: Map<string, any>) => {
        // entityMap contains objects like { categoryId, name } or { productId, name } or { activityId, name }
        // We just need the ids and the names to cache.
        const newIds = Array.from(entityMap.keys())
        const mergedValues = Array.from(new Set([...value.values, ...newIds]))

        onUpdate({ ...value, values: mergedValues })

        setDisplayMap((prev) => {
            const next = new Map(prev)
            entityMap.forEach((entity, id) => {
                next.set(id, entity.name || id)
            })
            return next
        })
    }

    const buttonLabels = {
        contains_category: "Додати категорії",
        contains_product: "Додати товари",
        contains_activity: "Додати сесії",
    }

    const chipIcons = {
        contains_category: "📁",
        contains_product: "📦",
        contains_activity: "🎯",
    }

    return (
        <div className="space-y-4 w-full">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Режим</Label>
                    <RadioGroup
                        value={value.mode}
                        onValueChange={(mode) => updateField("mode", mode)}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="include" id={`${type}-include`} className="cursor-pointer" />
                            <Label htmlFor={`${type}-include`} className="font-normal cursor-pointer">
                                Включити
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclude" id={`${type}-exclude`} className="cursor-pointer" />
                            <Label htmlFor={`${type}-exclude`} className="font-normal cursor-pointer">
                                Виключити
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Логіка</Label>
                    <RadioGroup
                        value={value.logic}
                        onValueChange={(logic) => updateField("logic", logic)}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="any" id={`${type}-any`} className="cursor-pointer" />
                            <Label htmlFor={`${type}-any`} className="font-normal cursor-pointer">
                                Один з обраних
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id={`${type}-all`} className="cursor-pointer" />
                            <Label htmlFor={`${type}-all`} className="font-normal cursor-pointer">
                                Всі вибрані
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Елементи</Label>

                <div className="flex flex-col gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(true)}
                        className="w-full sm:w-auto self-start cursor-pointer"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {buttonLabels[type]}
                    </Button>

                    {value.values.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {value.values.map((itemId) => (
                                <div
                                    key={itemId}
                                    className="bg-background border px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm"
                                >
                                    <span className="text-muted-foreground">{chipIcons[type]}</span>
                                    <span className="font-medium">{displayMap.get(itemId) || itemId}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeValue(itemId)}
                                        className="text-muted-foreground hover:text-foreground ml-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {type === "contains_category" && (
                    <CategorySelectionDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        onConfirm={handleConfirm}
                        initialCategoryIds={value.values}
                    />
                )}

                {type === "contains_product" && (
                    <ProductSelectionDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        selectionMode="multiple"
                        onConfirm={handleConfirm}
                        initialProductIds={value.values}
                    />
                )}

                {type === "contains_activity" && (
                    <ActivitySelectionDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        selectionMode="multiple"
                        onConfirm={handleConfirm}
                        initialActivityIds={value.values}
                    />
                )}
            </div>
        </div>
    )
}
