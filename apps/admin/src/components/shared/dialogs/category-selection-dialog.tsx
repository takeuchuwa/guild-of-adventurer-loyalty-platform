"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CategoryTable } from "@/components/categories/categories-table"
import { categoryColumns } from "@/components/categories/columns/category-columns"
import type { Category } from "@/components/categories/types/category-types"
import { Check } from "lucide-react"

interface CategorySelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (categories: Map<string, Category>) => void
    initialCategoryIds?: string[]
    kind?: "PRODUCT" | "ACTIVITY"
}

type Step = "selection" | "confirm"

export function CategorySelectionDialog({
    open,
    onOpenChange,
    onConfirm,
    initialCategoryIds = [],
    kind = "ACTIVITY",
}: CategorySelectionDialogProps) {
    const [currentStep, setCurrentStep] = useState<Step>("selection")
    const [selectedCategories, setSelectedCategories] = useState<Map<string, Category>>(new Map())

    useEffect(() => {
        if (open) {
            // No need to call loadCategories as CategoryTable handles this now
        } else {
            setCurrentStep("selection")
            setSelectedCategories(new Map())
        }
    }, [open, kind])

    const handleCategorySelection = (selected: Map<string, Category>) => {
        setSelectedCategories(selected)
    }

    const handleNext = () => {
        if (currentStep === "selection" && selectedCategories.size > 0) {
            setCurrentStep("confirm")
        }
    }

    const handleBack = () => {
        if (currentStep === "confirm") {
            setCurrentStep("selection")
        }
    }

    const handleConfirm = () => {
        onConfirm(selectedCategories)
        onOpenChange(false)
    }

    const handleStepClick = (step: Step) => {
        if (step === "selection") {
            setCurrentStep("selection")
        } else if (step === "confirm" && selectedCategories.size > 0) {
            setCurrentStep("confirm")
        }
    }

    const steps = [
        { id: "selection" as Step, label: "Вибір категорій", enabled: true },
        { id: "confirm" as Step, label: "Підтвердження", enabled: selectedCategories.size > 0 },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Вибір категорій</DialogTitle>
                    <DialogDescription>Оберіть одну або кілька категорій для активності</DialogDescription>
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
                            <CategoryTable
                                columns={categoryColumns.filter((col) => col.id === "name")}
                                selectionMode="multiple"
                                onSelectionChange={handleCategorySelection}
                                initialSelection={initialCategoryIds}
                                kind={kind} // Pass kind prop to filter categories
                                pageSize={5}
                            />
                        </div>
                    )}

                    {currentStep === "confirm" && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">Обрані категорії:</p>
                            <div className="space-y-2">
                                {Array.from(selectedCategories.values()).map((category) => (
                                    <div key={category.categoryId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary-foreground" />
                                        </div>
                                        <span className="font-semibold">{category.name}</span>
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
                            <Button onClick={handleConfirm} disabled={selectedCategories.size === 0}>
                                Підтвердити
                            </Button>
                        ) : (
                            <Button onClick={handleNext} disabled={selectedCategories.size === 0}>
                                Далі
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
