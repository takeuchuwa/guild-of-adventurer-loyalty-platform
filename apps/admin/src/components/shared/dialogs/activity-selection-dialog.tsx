"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ActivityTable } from "@/components/activities/activities-table"
import { activitiesColumns } from "@/components/activities/columns/activities-columns"
import { DateFilter } from "@/components/activities/filters/date-filter"
import type { Activity } from "@/components/activities/types/activity"
import type { DataTableFilter } from "@/components/table/data-table"
import { Check, CalendarDays } from "lucide-react"
import { formatDate } from "@/lib/format-utils"

type ActivitySelectionDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialActivityIds?: string[]
} & (
        | {
            selectionMode?: "single"
            onConfirm: (activityId: string, activityName: string) => void
        }
        | {
            selectionMode: "multiple"
            onConfirm: (activities: Map<string, Activity>) => void
        }
    )

type Step = "selection" | "confirm"

/** Inner component so that date-filter state is scoped to the dialog and resets on remount */
function ActivityDialogTableContent({
    onSelectionChange,
    selectionMode,
    initialActivityIds,
}: {
    onSelectionChange: (selected: Map<string, Activity>) => void
    selectionMode: "single" | "multiple"
    initialActivityIds?: string[]
}) {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    const filterParams = useMemo(() => {
        const params: { startDate?: number; endDate?: number } = {}
        if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            params.startDate = Math.floor(start.getTime() / 1000)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            params.endDate = Math.floor(end.getTime() / 1000)
        }
        return params
    }, [startDate, endDate])

    const filters: DataTableFilter[] = useMemo(
        () => [
            {
                component: (
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                ),
            },
        ],
        [startDate, endDate],
    )

    const dialogColumns = activitiesColumns.filter(
        (col) => col.id === "name" || col.id === "price"
    )

    return (
        <ActivityTable
            columns={dialogColumns}
            selectionMode={selectionMode}
            emptyStateMessage="Не знайдено сесій"
            onSelectionChange={onSelectionChange}
            filters={filters}
            filterParams={filterParams}
            initialSelection={initialActivityIds}
            pageSize={5}
        />
    )
}

export function ActivitySelectionDialog({
    open,
    onOpenChange,
    onConfirm,
    selectionMode = "single",
    initialActivityIds = [],
}: ActivitySelectionDialogProps) {
    const [currentStep, setCurrentStep] = useState<Step>("selection")
    const [selectedActivities, setSelectedActivities] = useState<Map<string, Activity>>(new Map())

    useEffect(() => {
        if (!open) {
            setCurrentStep("selection")
            setSelectedActivities(new Map())
        }
    }, [open])

    const handleActivitySelection = (selected: Map<string, Activity>) => {
        setSelectedActivities(selected)
    }

    const hasSelection = selectedActivities.size > 0

    const handleNext = () => {
        if (currentStep === "selection" && hasSelection) {
            setCurrentStep("confirm")
        }
    }

    const handleBack = () => {
        if (currentStep === "confirm") {
            setCurrentStep("selection")
        }
    }

    const handleConfirm = () => {
        if (selectionMode === "multiple") {
            ; (onConfirm as (activities: Map<string, Activity>) => void)(selectedActivities)
        } else {
            const activity = Array.from(selectedActivities.values())[0]
            if (activity) {
                ; (onConfirm as (activityId: string, activityName: string) => void)(
                    activity.activityId,
                    activity.name
                )
            }
        }
        onOpenChange(false)
    }

    const handleStepClick = (step: Step) => {
        if (step === "selection") {
            setCurrentStep("selection")
        } else if (step === "confirm" && hasSelection) {
            setCurrentStep("confirm")
        }
    }

    const steps = [
        { id: "selection" as Step, label: selectionMode === "multiple" ? "Вибір сесій" : "Вибір сесії", enabled: true },
        { id: "confirm" as Step, label: "Підтвердження", enabled: hasSelection },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{selectionMode === "multiple" ? "Вибір сесій" : "Вибір сесії"}</DialogTitle>
                    <DialogDescription>
                        {selectionMode === "multiple"
                            ? "Оберіть одну або кілька сесій"
                            : "Оберіть сесію для безкоштовного бонусу"}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Navigation */}
                <div className="flex items-center gap-2 py-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                onClick={() => handleStepClick(step.id)}
                                disabled={!step.enabled}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors flex-1 ${currentStep === step.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : step.enabled
                                        ? "border-muted hover:border-primary/50 cursor-pointer"
                                        : "border-muted text-muted-foreground cursor-not-allowed opacity-50"
                                    }`}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === step.id
                                        ? "bg-primary text-primary-foreground"
                                        : step.enabled
                                            ? "bg-muted"
                                            : "bg-muted/50"
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span className="font-medium">{step.label}</span>
                            </button>
                            {index < steps.length - 1 && <div className="w-8 h-0.5 bg-muted mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-auto">
                    {open && currentStep === "selection" && (
                        <div>
                            <ActivityDialogTableContent
                                onSelectionChange={handleActivitySelection}
                                selectionMode={selectionMode}
                                initialActivityIds={initialActivityIds}
                            />
                        </div>
                    )}

                    {currentStep === "confirm" && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">
                                {selectionMode === "multiple"
                                    ? `Обрані сесії (${selectedActivities.size}):`
                                    : "Обрана сесія:"}
                            </p>
                            <div className="space-y-2">
                                {Array.from(selectedActivities.values()).map((activity) => (
                                    <div key={activity.activityId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-semibold">{activity.name}</span>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                <span>{formatDate(activity.startDate)}</span>
                                                {activity.price > 0 && (
                                                    <span className="ml-2">
                                                        {activity.price.toLocaleString("uk-UA", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })} ₴
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        {currentStep !== "selection" && (
                            <Button variant="outline" onClick={handleBack}>
                                Назад
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Скасувати
                        </Button>
                        {currentStep === "confirm" ? (
                            <Button onClick={handleConfirm} disabled={!hasSelection}>
                                Підтвердити
                            </Button>
                        ) : (
                            <Button onClick={handleNext} disabled={!hasSelection}>
                                Далі
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
