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
import { GameTable } from "@/components/games/games-table"
import { defaultColumns } from "@/components/games/columns/defaultColumns"
import type { Game } from "@/components/games/types/game"
import type { System } from "@/components/games/types/game"
import { Link } from "react-router-dom"
import { AlertCircle, Check } from "lucide-react"

interface GameSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (gameId: string, systemId?: string) => void
    initialGameId?: string
    initialSystemId?: string
}

type Step = "game" | "system" | "confirm"

export function GameSelectionDialog({
    open,
    onOpenChange,
    onConfirm
}: GameSelectionDialogProps) {
    const [currentStep, setCurrentStep] = useState<Step>("game")
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null)

    useEffect(() => {
        if (!open) {
            setCurrentStep("game")
            setSelectedGame(null)
            setSelectedSystem(null)
        }
    }, [open])

    const handleGameSelection = (selected: Map<string, Game>) => {
        const game = Array.from(selected.values())[0]
        setSelectedGame(game || null)
    }

    const handleNext = () => {
        if (currentStep === "game" && selectedGame) {
            if (selectedGame.systems && selectedGame.systems.length > 0) {
                setCurrentStep("system")
            } else {
                setCurrentStep("confirm")
            }
        } else if (currentStep === "system") {
            setCurrentStep("confirm")
        }
    }

    const handleBack = () => {
        if (currentStep === "confirm") {
            if (selectedGame?.systems && selectedGame.systems.length > 0) {
                setCurrentStep("system")
            } else {
                setCurrentStep("game")
            }
        } else if (currentStep === "system") {
            setCurrentStep("game")
        }
    }

    const handleConfirm = () => {
        if (selectedGame) {
            onConfirm(selectedGame.gameId, selectedSystem?.systemId)
            onOpenChange(false)
        }
    }

    const handleStepClick = (step: Step) => {
        if (step === "game") {
            setCurrentStep("game")
        } else if (step === "system" && selectedGame) {
            setCurrentStep("system")
        } else if (step === "confirm" && selectedGame) {
            setCurrentStep("confirm")
        }
    }

    const steps = [
        { id: "game" as Step, label: "Вибір гри", enabled: true },
        { id: "system" as Step, label: "Вибір системи", enabled: !!selectedGame },
        { id: "confirm" as Step, label: "Підтвердження", enabled: !!selectedGame },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Вибір гри та системи</DialogTitle>
                    <DialogDescription>
                        Оберіть систему для активності. Якщо система має декілька редакцій/правил, ви зможете обрати одну з них.
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
                    {open && currentStep === "game" && (
                        <div>
                            <GameTable
                                columns={defaultColumns.filter((col) => col.id === "name")}
                                selectionMode="single"
                                onSelectionChange={handleGameSelection}
                            />
                        </div>
                    )}

                    {currentStep === "system" && selectedGame && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Обрана гра: <span className="font-semibold text-foreground">{selectedGame.name}</span>
                            </div>

                            {selectedGame.systems && selectedGame.systems.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Оберіть систему:</p>
                                    <div className="grid gap-2">
                                        {selectedGame.systems.map((system) => (
                                            <button
                                                key={system.systemId}
                                                onClick={() => setSelectedSystem(system)}
                                                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${selectedSystem?.systemId === system.systemId
                                                    ? "border-primary bg-primary/10"
                                                    : "border-muted hover:border-primary/50"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSystem?.systemId === system.systemId ? "border-primary bg-primary" : "border-muted"
                                                        }`}
                                                >
                                                    {selectedSystem?.systemId === system.systemId && (
                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-semibold">{system.name}</div>
                                                    {system.description && (
                                                        <div className="text-sm text-muted-foreground">{system.description}</div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-8 text-center">
                                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">Немає доступних систем</p>
                                        <p className="text-sm text-muted-foreground mt-1">Для цієї гри ще не створено жодної системи</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline">
                                            <Link to={`/games/${selectedGame.gameId}`} target="_blank">
                                                Створити редакцію/правила
                                            </Link>
                                        </Button>
                                        <Button onClick={() => setCurrentStep("confirm")}>Продовжити без редакції/правил</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === "confirm" && selectedGame && (
                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">Підтвердіть ваш вибір:</p>
                            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <span className="text-sm text-muted-foreground">Гра:</span>
                                    <p className="font-semibold">{selectedGame.name}</p>
                                </div>
                                {selectedSystem && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Система:</span>
                                        <p className="font-semibold">{selectedSystem.name}</p>
                                    </div>
                                )}
                                {!selectedSystem && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Система:</span>
                                        <p className="italic text-muted-foreground">Не обрано</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        {currentStep !== "game" && (
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
                            <Button onClick={handleConfirm} disabled={!selectedGame}>
                                Підтвердити
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    currentStep === "game"
                                        ? !selectedGame
                                        : currentStep === "system" &&
                                        !selectedSystem &&
                                        selectedGame?.systems &&
                                        selectedGame.systems.length > 0
                                }
                            >
                                Далі
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
