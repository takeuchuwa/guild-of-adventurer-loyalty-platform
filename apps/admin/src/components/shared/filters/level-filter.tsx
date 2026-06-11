"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Award, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchLevels } from "@/components/levels/api/level-api"
import type { Level } from "@/components/levels/types/level"

interface LevelFilterProps {
    selectedLevelId: string | undefined
    onChange: (levelId: string | undefined) => void
}

export function LevelFilter({ selectedLevelId, onChange }: LevelFilterProps) {
    const [levels, setLevels] = useState<Level[]>([])
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    useEffect(() => {
        if (open && !hasLoaded) {
            const loadLevels = async () => {
                setIsLoading(true)
                try {
                    const data = await fetchLevels({ pageSize: 100 })
                    setLevels(data.levels || [])
                    setHasLoaded(true)
                } catch (error) {
                    console.error("Error loading filter levels:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            loadLevels()
        }
    }, [open, hasLoaded])

    const selectedLevel = levels.find((l) => l.levelId === selectedLevelId)

    const handleSelect = (levelId: string) => {
        if (!levelId) {
            onChange(undefined)
        } else {
            onChange(levelId)
        }
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 px-3 border-dashed flex items-center gap-1 cursor-pointer",
                        selectedLevelId && "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                    )}
                >
                    <Award className="h-4 w-4" />
                    <span>Рівень: {selectedLevel ? selectedLevel.name : "Усі"}</span>
                    {selectedLevelId ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(undefined)
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
            <PopoverContent className="w-56 p-1" align="start">
                {isLoading ? (
                    <div className="p-3 text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Завантаження...</span>
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                        <button
                            onClick={() => handleSelect("")}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-left"
                        >
                            <span>Усі рівні</span>
                            {!selectedLevelId && <Check className="h-4 w-4" />}
                        </button>
                        {levels.map((level) => (
                            <button
                                key={level.levelId}
                                onClick={() => handleSelect(level.levelId)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent text-left cursor-pointer"
                            >
                                <span>{level.name}</span>
                                {selectedLevelId === level.levelId && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
