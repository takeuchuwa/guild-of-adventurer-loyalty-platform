"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDown, CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface PromoFilterProps {
    active: boolean | undefined // true = active, false = inactive, undefined = all
    date: Date | undefined
    onActiveChange: (active: boolean | undefined) => void
    onDateChange: (date: Date | undefined) => void
}

export function PromoFilter({ active, date, onActiveChange, onDateChange }: PromoFilterProps) {
    const [open, setOpen] = useState(false)
    const [tempActive, setTempActive] = useState<boolean | undefined>(active)
    const [tempDate, setTempDate] = useState<Date | undefined>(date)
    const [showCalendar, setShowCalendar] = useState(false)

    const handleApply = () => {
        onActiveChange(tempActive)
        onDateChange(tempDate)
        setOpen(false)
    }

    const handleClear = () => {
        setTempActive(undefined)
        setTempDate(undefined)
        onActiveChange(undefined)
        onDateChange(undefined)
        setOpen(false)
    }

    const hasActiveFilter = active !== undefined || date !== undefined

    let label = "Фільтри промоакцій"
    if (active !== undefined && date !== undefined) {
        label = `Промо: ${active ? "Активні" : "Неактивні"} на ${format(date, "dd.MM.yyyy", { locale: uk })}`
    } else if (active !== undefined) {
        label = `Промо: ${active ? "Активні" : "Неактивні"}`
    } else if (date !== undefined) {
        label = `Промо: дійсні на ${format(date, "dd.MM.yyyy", { locale: uk })}`
    }

    return (
        <Popover
            open={open}
            onOpenChange={(val) => {
                setOpen(val)
                if (val) {
                    setTempActive(active)
                    setTempDate(date)
                    setShowCalendar(false)
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
                    <span>{label}</span>
                    {hasActiveFilter ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClear()
                            }}
                            className="ml-1 p-0.5 hover:bg-accent cursor-pointer"
                            title="Очистити фільтри"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    ) : (
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 bg-background border" align="start">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Статус промоакції</label>
                        <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-md text-xs">
                            <button
                                type="button"
                                onClick={() => setTempActive(undefined)}
                                className={cn(
                                    "py-1.5 px-2 rounded-sm font-medium transition-colors text-center cursor-pointer",
                                    tempActive === undefined
                                        ? "bg-background shadow text-foreground"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                Усі
                            </button>
                            <button
                                type="button"
                                onClick={() => setTempActive(true)}
                                className={cn(
                                    "py-1.5 px-2 rounded-sm font-medium transition-colors text-center cursor-pointer",
                                    tempActive === true
                                        ? "bg-background shadow text-foreground"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                Активні
                            </button>
                            <button
                                type="button"
                                onClick={() => setTempActive(false)}
                                className={cn(
                                    "py-1.5 px-2 rounded-sm font-medium transition-colors text-center cursor-pointer",
                                    tempActive === false
                                        ? "bg-background shadow text-foreground"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                Неактивні
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Дійсні на дату</label>
                        {showCalendar ? (
                            <div className="border rounded-md p-1 bg-background relative z-50">
                                <Calendar
                                    mode="single"
                                    selected={tempDate}
                                    onSelect={(d) => {
                                        setTempDate(d)
                                        setShowCalendar(false)
                                    }}
                                    initialFocus
                                    locale={uk}
                                />
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-left font-normal cursor-pointer"
                                    onClick={() => setShowCalendar(true)}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {tempDate ? format(tempDate, "dd.MM.yyyy", { locale: uk }) : "Оберіть дату..."}
                                </Button>
                                {tempDate && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTempDate(undefined)}
                                        className="px-2 cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
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
