"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"

interface DateTimePickerProps {
    value?: number // Unix timestamp in seconds
    onChange: (value: number) => void
    error?: string
    disabled?: boolean
}

export function DateTimePicker({ value, onChange, error, disabled }: DateTimePickerProps) {
    const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value * 1000) : undefined)

    React.useEffect(() => {
        if (value) {
            const dateObj = new Date(value * 1000)
            setDate(dateObj)
        } else {
            setDate(undefined)
        }
    }, [value])

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const newDate = new Date(selectedDate)

            if (date) {
                newDate.setHours(date.getHours(), date.getMinutes(), 0, 0)
            } else {
                // Set default time to current time
                const now = new Date()
                newDate.setHours(now.getHours(), now.getMinutes(), 0, 0)
            }

            setDate(newDate)

            const timestamp = Math.floor(newDate.getTime() / 1000)
            onChange(timestamp)
        }
    }

    const handleTimeChange = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate)
            const timestamp = Math.floor(newDate.getTime() / 1000)
            onChange(timestamp)
        }
    }

    const formatDateTime = (date: Date) => {
        const dateStr = date.toLocaleDateString("uk-UA")
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        return `${dateStr} ${hours}:${minutes}`
    }

    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-time-picker"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                            error && "border-destructive",
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? formatDateTime(date) : "Оберіть дату та час"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
                    <div className="border-t border-border p-3">
                        <TimePicker date={date} setDate={handleTimeChange} />
                    </div>
                </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
