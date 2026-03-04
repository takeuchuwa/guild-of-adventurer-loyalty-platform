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
import { MemberTable } from "@/components/members/members-table"
import { memberColumns } from "@/components/members/columns/member-columns"
import type { Member } from "@/components/members/types/member"
import { Check } from "lucide-react"

interface MemberSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (members: Map<string, Member>) => void
    excludeMemberIds?: string[]
    initialMemberIds?: string[]
    selectionMode?: "single" | "multiple"
}

type Step = "selection" | "confirm"

export function MemberSelectionDialog({
    open,
    onOpenChange,
    onConfirm,
    excludeMemberIds = [],
    initialMemberIds = [],
    selectionMode = "multiple",
}: MemberSelectionDialogProps) {
    const [currentStep, setCurrentStep] = useState<Step>("selection")
    const [selectedMembers, setSelectedMembers] = useState<Map<string, Member>>(new Map())

    useEffect(() => {
        if (!open) {
            setCurrentStep("selection")
            setSelectedMembers(new Map())
        }
    }, [open])

    const handleMemberSelection = (selected: Map<string, Member>) => {
        setSelectedMembers(selected)
    }

    const handleNext = () => {
        if (currentStep === "selection" && selectedMembers.size > 0) {
            setCurrentStep("confirm")
        }
    }

    const handleBack = () => {
        if (currentStep === "confirm") {
            setCurrentStep("selection")
        }
    }

    const handleConfirm = () => {
        onConfirm(selectedMembers)
        onOpenChange(false)
    }

    const handleStepClick = (step: Step) => {
        if (step === "selection") {
            setCurrentStep("selection")
        } else if (step === "confirm" && selectedMembers.size > 0) {
            setCurrentStep("confirm")
        }
    }

    const steps = [
        { id: "selection" as Step, label: "Вибір учасників", enabled: true },
        { id: "confirm" as Step, label: "Підтвердження", enabled: selectedMembers.size > 0 },
    ]

    // Filter columns to show only name and phone
    const dialogColumns = memberColumns.filter((col) => col.id === "firstName" || col.id === "phone")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Вибір учасників</DialogTitle>
                    <DialogDescription>Оберіть учасників для призначення промоакції</DialogDescription>
                </DialogHeader>

                {/* Step Navigation */}
                <div className="flex items-center gap-2 py-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                type="button"
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
                            <MemberTable
                                columns={dialogColumns}
                                selectionMode={selectionMode}
                                onSelectionChange={handleMemberSelection}
                                searchPlaceholder="Пошук учасників..."
                                initialSelection={initialMemberIds}
                            />
                        </div>
                    )}

                    {currentStep === "confirm" && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">Обрані учасники ({selectedMembers.size}):</p>
                            <div className="space-y-2">
                                {Array.from(selectedMembers.values()).map((member) => (
                                    <div key={member.memberId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-3 h-3 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                {member.firstName} {member.lastName}
                                            </span>
                                            {member.phone && (
                                                <span className="text-sm text-muted-foreground ml-2">{member.phone}</span>
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
                            <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                                Назад
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
                            Скасувати
                        </Button>
                        {currentStep === "confirm" ? (
                            <Button onClick={handleConfirm} disabled={selectedMembers.size === 0} className="cursor-pointer">
                                Підтвердити ({selectedMembers.size})
                            </Button>
                        ) : (
                            <Button onClick={handleNext} disabled={selectedMembers.size === 0} className="cursor-pointer">
                                Далі
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
