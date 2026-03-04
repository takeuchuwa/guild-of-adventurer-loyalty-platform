"use client"

import type React from "react"
import {useState} from "react"

import {Button} from "@/components/ui/button"
import {Calendar} from "@/components/ui/calendar"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Label} from "@/components/ui/label"
import {cn} from "@/lib/utils"
import {format} from "date-fns"
import {uk} from "date-fns/locale"
import {CalendarIcon, Filter, X} from "lucide-react"

interface DateFilterProps {
    startDate: Date | undefined
    endDate: Date | undefined
    onStartDateChange: (date: Date | undefined) => void
    onEndDateChange: (date: Date | undefined) => void
}

export function DateFilter({startDate, endDate, onStartDateChange, onEndDateChange}: DateFilterProps) {
    const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate)
    const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate)

    const handleClearStartDate = (e: React.MouseEvent) => {
        e.stopPropagation()
        setTempStartDate(undefined)
    }

    const handleClearEndDate = (e: React.MouseEvent) => {
        e.stopPropagation()
        setTempEndDate(undefined)
    }

    const handleApplyFilters = () => {
        onStartDateChange(tempStartDate)
        onEndDateChange(tempEndDate)
    }

    const handleResetFilters = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setTempStartDate(today)
        setTempEndDate(undefined)
        onStartDateChange(today)
        onEndDateChange(undefined)
    }

    return (
        <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Фільтр за датою:</Label>

            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "justify-start text-left font-normal min-w-[140px] relative",
                                tempStartDate ? "pr-8" : "",
                                !tempStartDate && "text-muted-foreground",
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4"/>
                            {tempStartDate ? format(tempStartDate, "dd.MM.yyyy", {locale: uk}) : "Початок"}
                            {tempStartDate && (
                                <span
                                    onClick={handleClearStartDate}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-sm opacity-70 hover:opacity-100 hover:bg-accent flex items-center justify-center cursor-pointer"
                                    title="Очистити початкову дату"
                                >
                  <X className="h-3 w-3"/>
                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={tempStartDate}
                            onSelect={(date) => setTempStartDate(date || undefined)}
                            initialFocus
                            locale={uk}
                        />
                    </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">—</span>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "justify-start text-left font-normal min-w-[140px] relative",
                                tempEndDate ? "pr-8" : "",
                                !tempEndDate && "text-muted-foreground",
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4"/>
                            {tempEndDate ? format(tempEndDate, "dd.MM.yyyy", {locale: uk}) : "Кінець"}
                            {tempEndDate && (
                                <span
                                    onClick={handleClearEndDate}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-sm opacity-70 hover:opacity-100 hover:bg-accent flex items-center justify-center cursor-pointer"
                                    title="Очистити кінцеву дату"
                                >
                  <X className="h-3 w-3"/>
                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={tempEndDate}
                            onSelect={(date) => setTempEndDate(date || undefined)}
                            initialFocus
                            locale={uk}
                        />
                    </PopoverContent>
                </Popover>

                <Button onClick={handleApplyFilters} size="sm" variant="default">
                    <Filter className="mr-2 h-4 w-4"/>
                    Застосувати
                </Button>

                <Button onClick={handleResetFilters} size="sm" variant="outline">
                    Скинути
                </Button>
            </div>
        </div>
    )
}
