"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ChevronDown, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumericFilterProps {
    label: string // e.g. "Ціна" or "Бали XP"
    value: number | undefined
    operator: string | undefined
    onChange: (value: number | undefined, operator: string | undefined) => void
    defaultOperator?: "lt" | "lte" | "eq" | "gte" | "gt"
    suffix?: string // e.g. "₴" or "XP"
}

const OPERATORS = [
    { value: "lte", label: "Не більше ніж" },
    { value: "gte", label: "Не менше ніж" },
    { value: "eq", label: "Дорівнює" },
    { value: "lt", label: "Менше ніж" },
    { value: "gt", label: "Більше ніж" },
]

export function NumericFilter({
    label,
    value,
    operator,
    onChange,
    defaultOperator = "lte",
    suffix = "",
}: NumericFilterProps) {
    const [open, setOpen] = useState(false)
    const [tempValue, setTempValue] = useState<string>(value !== undefined ? String(value) : "")
    const [tempOperator, setTempOperator] = useState<string>(operator || defaultOperator)

    const handleApply = () => {
        const parsed = parseFloat(tempValue)
        if (!isNaN(parsed)) {
            onChange(parsed, tempOperator)
        } else {
            onChange(undefined, undefined)
        }
        setOpen(false)
    }

    const handleClear = () => {
        setTempValue("")
        setTempOperator(defaultOperator)
        onChange(undefined, undefined)
        setOpen(false)
    }

    const activeOperatorLabel = OPERATORS.find((op) => op.value === (operator || tempOperator))?.label || ""
    const hasActiveFilter = value !== undefined && operator !== undefined

    return (
        <Popover
            open={open}
            onOpenChange={(val) => {
                setOpen(val)
                if (val) {
                    setTempValue(value !== undefined ? String(value) : "")
                    setTempOperator(operator || defaultOperator)
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 px-3 border-dashed flex items-center gap-1 cursor-pointer",
                        hasActiveFilter && "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    <span>
                        {label}: {hasActiveFilter ? `${activeOperatorLabel} ${value}${suffix ? " " + suffix : ""}` : "Усі"}
                    </span>
                    {hasActiveFilter ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClear()
                            }}
                            className="ml-1 p-0.5 hover:bg-accent cursor-pointer"
                            title="Очистити фільтр"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    ) : (
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Умова порівняння</label>
                        <select
                            value={tempOperator}
                            onChange={(e) => setTempOperator(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {OPERATORS.map((op) => (
                                <option key={op.value} value={op.value} className="bg-background text-foreground">
                                    {op.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Значення ({suffix || "число"})</label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            placeholder="Введіть число..."
                            onKeyDown={(e) => e.key === "Enter" && handleApply()}
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={handleClear} className="cursor-pointer">
                            Скинути
                        </Button>
                        <Button size="sm" onClick={handleApply} className="cursor-pointer">
                            Застосувати
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
