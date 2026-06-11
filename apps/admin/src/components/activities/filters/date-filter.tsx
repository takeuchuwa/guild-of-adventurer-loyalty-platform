"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { CalendarIcon, ChevronDown, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface DateFilterProps {
    startDate: Date | undefined
    endDate: Date | undefined
    onStartDateChange: (date: Date | undefined) => void
    onEndDateChange: (date: Date | undefined) => void
}

export function DateFilter({ startDate, endDate, onStartDateChange, onEndDateChange }: DateFilterProps) {
    const [open, setOpen] = useState(false)
    const [tempRange, setTempRange] = useState<DateRange | undefined>(() => ({
        from: startDate,
        to: endDate,
    }))

    const handleApplyFilters = () => {
        onStartDateChange(tempRange?.from)
        onEndDateChange(tempRange?.to)
        setOpen(false)
    }

    const handleResetFilters = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setTempRange({ from: today, to: undefined })
        onStartDateChange(today)
        onEndDateChange(undefined)
        setOpen(false)
    }

    const handleClear = () => {
        setTempRange(undefined)
        onStartDateChange(undefined)
        onEndDateChange(undefined)
    }

    const hasActiveFilter = startDate !== undefined || endDate !== undefined

    let label = "Дата: Усі"
    if (startDate && endDate) {
        label = `Дата: ${format(startDate, "dd.MM.yyyy", { locale: uk })} — ${format(endDate, "dd.MM.yyyy", { locale: uk })}`
    } else if (startDate) {
        label = `Дата: від ${format(startDate, "dd.MM.yyyy", { locale: uk })}`
    } else if (endDate) {
        label = `Дата: до ${format(endDate, "dd.MM.yyyy", { locale: uk })}`
    }

    return (
        <Popover
            open={open}
            onOpenChange={(val) => {
                setOpen(val)
                if (val) {
                    setTempRange({ from: startDate, to: endDate })
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
                    <CalendarIcon className="h-4 w-4" />
                    <span>{label}</span>
                    {hasActiveFilter ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClear()
                            }}
                            className="ml-1 rounded-full p-0.5 hover:bg-accent cursor-pointer"
                            title="Очистити фільтр"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    ) : (
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-background border" align="start">
                <div className="space-y-3">
                    <Calendar
                        initialFocus
                        mode="range"
                        selected={tempRange}
                        onSelect={setTempRange}
                        locale={uk}
                        numberOfMonths={1}
                    />
                    <div className="flex gap-2 justify-end pt-1 border-t">
                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="cursor-pointer">
                            Скинути
                        </Button>
                        <Button size="sm" onClick={handleApplyFilters} className="cursor-pointer">
                            Застосувати
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
