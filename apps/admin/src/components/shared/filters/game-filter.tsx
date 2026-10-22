"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Gamepad2, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchGames } from "@/components/games/api/api"
import type { Game } from "@/components/games/types/game"

interface GameFilterProps {
    selectedGameId: string | undefined
    onChange: (gameId: string | undefined) => void
}

export function GameFilter({ selectedGameId, onChange }: GameFilterProps) {
    const [games, setGames] = useState<Game[]>([])
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    useEffect(() => {
        if (open && !hasLoaded) {
            const loadGames = async () => {
                setIsLoading(true)
                try {
                    // Fetch games with a large page size
                    const data = await fetchGames({
                        pagination: { pageSize: 100 },
                        sorting: [{ id: "name", desc: false }],
                    })
                    setGames(data.games || [])
                    setHasLoaded(true)
                } catch (error) {
                    console.error("Error loading filter games:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            loadGames()
        }
    }, [open, hasLoaded])

    const selectedGame = games.find((g) => g.gameId === selectedGameId)

    const handleSelect = (gameId: string) => {
        if (!gameId) {
            onChange(undefined)
        } else {
            onChange(gameId)
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
                        selectedGameId && "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                    )}
                >
                    <Gamepad2 className="h-4 w-4" />
                    <span>Гра: {selectedGame ? selectedGame.name : "Усі"}</span>
                    {selectedGameId ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(undefined)
                            }}
                            className="ml-1 p-0.5 hover:bg-accent cursor-pointer"
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
                            <span>Усі ігри</span>
                            {!selectedGameId && <Check className="h-4 w-4" />}
                        </button>
                        {games.map((game) => (
                            <button
                                key={game.gameId}
                                onClick={() => handleSelect(game.gameId)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent text-left cursor-pointer"
                            >
                                <span>{game.name}</span>
                                {selectedGameId === game.gameId && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
