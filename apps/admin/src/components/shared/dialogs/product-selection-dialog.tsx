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
import { ProductTable } from "@/components/products/products-table"
import { productsColumns } from "@/components/products/columns/products-columns"
import type { Product } from "@/components/products/types/product"
import { Check, Package } from "lucide-react"

type ProductSelectionDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialProductIds?: string[]
} & (
        | {
            selectionMode?: "single"
            onConfirm: (productId: string, productName: string) => void
        }
        | {
            selectionMode: "multiple"
            onConfirm: (products: Map<string, Product>) => void
        }
    )

type Step = "selection" | "confirm"

export function ProductSelectionDialog({
    open,
    onOpenChange,
    onConfirm,
    selectionMode = "single",
    initialProductIds = [],
}: ProductSelectionDialogProps) {
    const [currentStep, setCurrentStep] = useState<Step>("selection")
    const [selectedProducts, setSelectedProducts] = useState<Map<string, Product>>(new Map())

    useEffect(() => {
        if (!open) {
            setCurrentStep("selection")
            setSelectedProducts(new Map())
        }
    }, [open])

    const handleProductSelection = (selected: Map<string, Product>) => {
        setSelectedProducts(selected)
    }

    const hasSelection = selectedProducts.size > 0

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
            ; (onConfirm as (products: Map<string, Product>) => void)(selectedProducts)
        } else {
            const product = Array.from(selectedProducts.values())[0]
            if (product) {
                ; (onConfirm as (productId: string, productName: string) => void)(
                    product.productId,
                    product.name || product.productId
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

    const dialogColumns = productsColumns.filter(
        (col) => col.id === "name" || col.id === "price"
    )

    const steps = [
        { id: "selection" as Step, label: selectionMode === "multiple" ? "Вибір товарів" : "Вибір товару", enabled: true },
        { id: "confirm" as Step, label: "Підтвердження", enabled: hasSelection },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{selectionMode === "multiple" ? "Вибір товарів" : "Вибір товару"}</DialogTitle>
                    <DialogDescription>
                        {selectionMode === "multiple"
                            ? "Оберіть один або кілька товарів"
                            : "Оберіть товар для безкоштовного бонусу"}
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
                            <ProductTable
                                columns={dialogColumns}
                                selectionMode={selectionMode}
                                emptyStateMessage="Не знайдено товарів"
                                onSelectionChange={handleProductSelection}
                                initialSelection={initialProductIds}
                                pageSize={5}
                            />
                        </div>
                    )}

                    {currentStep === "confirm" && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">
                                {selectionMode === "multiple"
                                    ? `Обрані товари (${selectedProducts.size}):`
                                    : "Обраний товар:"}
                            </p>
                            <div className="space-y-2">
                                {Array.from(selectedProducts.values()).map((product) => (
                                    <div key={product.productId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-semibold">{product.name}</span>
                                            {product.price > 0 && (
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <Package className="w-3.5 h-3.5" />
                                                    <span>
                                                        {product.price.toLocaleString("uk-UA", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })} ₴
                                                    </span>
                                                </div>
                                            )}
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
