"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { GameSelectionDialog } from "@/components/shared/dialogs/game-selection-dialog"
import { CategorySelectionDialog } from "@/components/shared/dialogs/category-selection-dialog"
import { RoomSelectionDialog } from "@/components/shared/dialogs/room-selection-dialog"
import { Loader2, X } from "lucide-react"
import type { Activity } from "./types/activity"
import { getGameById } from "@/components/games/api/api"
import { getRoomById } from "@/components/rooms/api/room-api"
import { z } from "zod"

const activitySchema = z.object({
    name: z.string().min(1, "Назва обов'язкова"),
    description: z.string().optional(),
    price: z.number().min(0, "Ціна повинна бути більше або дорівнювати 0"),
    overridePoints: z.number().nullable().optional(),
    startDate: z.number().min(1, "Дата початку обов'язкова"),
    endDate: z.number().min(1, "Дата завершення обов'язкова"),
    gameId: z.string().nullable().optional(),
    systemId: z.string().nullable().optional(),
    roomId: z.string().nullable().optional(),
    categoryIds: z.array(z.string()).min(1, "Оберіть хоча б одну категорію"),
})

export type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
    initialData?: Activity
    onSubmit: (data: ActivityFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
}

export function ActivityForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: ActivityFormProps) {
    const [gameDialogOpen, setGameDialogOpen] = useState(false)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [roomDialogOpen, setRoomDialogOpen] = useState(false)
    const [selectedGame, setSelectedGame] = useState<{ gameId: string; name: string } | null>(
        initialData?.game ? { gameId: initialData.game.gameId, name: initialData.game.name } : null,
    )
    const [selectedSystem, setSelectedSystem] = useState<{ systemId: string; name: string } | null>(
        initialData?.system ? { systemId: initialData.system.systemId, name: initialData.system.name } : null,
    )
    const [selectedRoom, setSelectedRoom] = useState<{ roomId: string; name: string; color: string } | null>(
        initialData?.room
            ? { roomId: initialData.room.roomId, name: initialData.room.name, color: initialData.room.color }
            : null,
    )
    const [selectedCategories, setSelectedCategories] = useState<Array<{ categoryId: string; name: string }>>(
        initialData?.categories?.map((c) => ({ categoryId: c.categoryId, name: c.name })) || [],
    )

    const [formData, setFormData] = useState<ActivityFormData>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price || 0,
        overridePoints: initialData?.overridePoints ?? null,
        startDate: initialData?.startDate || Math.floor(Date.now() / 1000),
        endDate: initialData?.endDate || Math.floor(Date.now() / 1000) + 3600,
        gameId: initialData?.game?.gameId || null,
        systemId: initialData?.system?.systemId || null,
        roomId: initialData?.room?.roomId || null,
        categoryIds: initialData?.categories?.map((c) => c.categoryId) || [],
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormData, string>>>({})

    const [isMultiDay, setIsMultiDay] = useState(false)
    const [duration, setDuration] = useState<Date | undefined>(() => {
        const d = new Date()
        d.setHours(1, 0, 0, 0)
        return d
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                description: initialData.description || "",
                price: initialData.price || 0,
                overridePoints: initialData.overridePoints ?? null,
                startDate: initialData.startDate || Math.floor(Date.now() / 1000),
                endDate: initialData.endDate || Math.floor(Date.now() / 1000) + 3600,
                gameId: initialData.game?.gameId || null,
                systemId: initialData.system?.systemId || null,
                roomId: initialData.room?.roomId || null,
                categoryIds: initialData.categories?.map((c) => c.categoryId) || [],
            })

            if (initialData.startDate && initialData.endDate) {
                const startDate = new Date(initialData.startDate * 1000)
                const endDate = new Date(initialData.endDate * 1000)

                const isSameDay =
                    startDate.getFullYear() === endDate.getFullYear() &&
                    startDate.getMonth() === endDate.getMonth() &&
                    startDate.getDate() === endDate.getDate()

                setIsMultiDay(!isSameDay)

                if (isSameDay) {
                    const durationSeconds = initialData.endDate - initialData.startDate
                    const hours = Math.floor(durationSeconds / 3600)
                    const minutes = Math.floor((durationSeconds % 3600) / 60)

                    const durationDate = new Date()
                    durationDate.setHours(hours, minutes, 0, 0)
                    setDuration(durationDate)
                }
            }

            if (initialData.game) {
                setSelectedGame({ gameId: initialData.game.gameId, name: initialData.game.name })
            }
            if (initialData.system) {
                setSelectedSystem({ systemId: initialData.system.systemId, name: initialData.system.name })
            }
            if (initialData.room) {
                setSelectedRoom({
                    roomId: initialData.room.roomId,
                    name: initialData.room.name,
                    color: initialData.room.color,
                })
            }
            if (initialData.categories) {
                setSelectedCategories(initialData.categories.map((c) => ({ categoryId: c.categoryId, name: c.name })))
            }
        }
    }, [initialData])

    const validateForm = (): boolean => {
        try {
            activitySchema.parse(formData)
            setErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof ActivityFormData, string>> = {}
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof ActivityFormData] = err.message
                    }
                })
                setErrors(newErrors)
            }
            return false
        }
    }

    const handleGameSelection = async (gameId: string, systemId?: string) => {
        setFormData({ ...formData, gameId, systemId: systemId || null })

        try {
            const game = await getGameById(gameId)
            setSelectedGame({ gameId: game.gameId, name: game.name })

            if (systemId && game.systems) {
                const system = game.systems.find((s) => s.systemId === systemId)
                if (system) {
                    setSelectedSystem({ systemId: system.systemId, name: system.name })
                }
            } else {
                setSelectedSystem(null)
            }
        } catch (error) {
            console.error("Error fetching game:", error)
        }
    }

    const handleCategorySelection = (categoriesMap: Map<string, any>) => {
        const categoryIds = Array.from(categoriesMap.keys())
        setFormData({ ...formData, categoryIds })
        setSelectedCategories(Array.from(categoriesMap.values()).map((c) => ({ categoryId: c.categoryId, name: c.name })))
        if (errors.categoryIds) {
            setErrors({ ...errors, categoryIds: undefined })
        }
    }

    const handleRoomSelection = async (roomId: string) => {
        setFormData({ ...formData, roomId })

        try {
            const room = await getRoomById(roomId)
            setSelectedRoom({ roomId: room.roomId, name: room.name, color: room.color })
        } catch (error) {
            console.error("Error fetching room:", error)
        }
    }

    const handleRemoveGame = () => {
        setSelectedGame(null)
        setSelectedSystem(null)
        setFormData({ ...formData, gameId: null, systemId: null })
    }

    const handleRemoveCategory = (categoryId: string) => {
        const newCategories = selectedCategories.filter((c) => c.categoryId !== categoryId)
        setSelectedCategories(newCategories)
        setFormData({ ...formData, categoryIds: newCategories.map((c) => c.categoryId) })
    }

    const handleRemoveRoom = () => {
        setSelectedRoom(null)
        setFormData({ ...formData, roomId: null })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const finalFormData = { ...formData }

        if (!isMultiDay && duration) {
            const startDate = new Date(formData.startDate * 1000)
            const durationHours = duration.getHours()
            const durationMinutes = duration.getMinutes()

            const endDate = new Date(startDate)
            endDate.setHours(startDate.getHours() + durationHours)
            endDate.setMinutes(startDate.getMinutes() + durationMinutes)

            finalFormData.endDate = Math.floor(endDate.getTime() / 1000)
        }

        if (!validateForm()) {
            return
        }

        try {
            await onSubmit(finalFormData)
        } catch (error) {
            console.error("Form submission error:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">
                    Назва активності <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) {
                            setErrors({ ...errors, name: undefined })
                        }
                    }}
                    placeholder="Введіть назву активності"
                    disabled={isLoading}
                    className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Введіть опис активності"
                    rows={3}
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="price">
                    Ціна <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price === 0 ? "" : formData.price}
                    onChange={(e) => {
                        const inputValue = e.target.value
                        const numValue = inputValue === "" ? 0 : Number.parseFloat(inputValue)
                        setFormData({ ...formData, price: isNaN(numValue) ? 0 : numValue })
                        if (errors.price) {
                            setErrors({ ...errors, price: undefined })
                        }
                    }}
                    placeholder="0.00"
                    disabled={isLoading}
                    className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="overridePoints">Перевизначити бали</Label>
                <Input
                    id="overridePoints"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.overridePoints ?? ""}
                    onChange={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value)
                        setFormData({ ...formData, overridePoints: value })
                        if (errors.overridePoints) {
                            setErrors({ ...errors, overridePoints: undefined })
                        }
                    }}
                    placeholder="Залишіть порожнім для автоматичного розрахунку (10% ціни)"
                    disabled={isLoading}
                    className={errors.overridePoints ? "border-destructive" : ""}
                />
                {errors.overridePoints && <p className="text-sm text-destructive">{errors.overridePoints}</p>}
                <p className="text-sm text-muted-foreground">Якщо не вказано, буде використано 10% від ціни</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>
                        Дата та час початку <span className="text-destructive">*</span>
                    </Label>
                    <DateTimePicker
                        value={formData.startDate}
                        onChange={(value) => {
                            setFormData({ ...formData, startDate: value })
                            if (errors.startDate) {
                                setErrors({ ...errors, startDate: undefined })
                            }
                        }}
                    />
                    {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                    {isMultiDay ? (
                        <>
                            <Label>
                                Дата та час завершення <span className="text-destructive">*</span>
                            </Label>
                            <DateTimePicker
                                value={formData.endDate}
                                onChange={(value) => {
                                    setFormData({ ...formData, endDate: value })
                                    if (errors.endDate) {
                                        setErrors({ ...errors, endDate: undefined })
                                    }
                                }}
                            />
                            {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                        </>
                    ) : (
                        <>
                            <Label>
                                Тривалість <span className="text-destructive">*</span>
                            </Label>
                            <TimePicker date={duration} setDate={setDuration} />
                            <p className="text-sm text-muted-foreground">Вкажіть тривалість активності (години та хвилини)</p>
                        </>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="multiDay"
                            checked={isMultiDay}
                            onCheckedChange={(checked) => setIsMultiDay(checked as boolean)}
                            disabled={isLoading}
                        />
                        <Label htmlFor="multiDay" className="text-sm font-normal cursor-pointer">
                            Активність триває кілька днів
                        </Label>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Гра</Label>
                {selectedGame ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                            <p className="font-semibold">{selectedGame.name}</p>
                            {selectedSystem && <p className="text-sm text-muted-foreground">{selectedSystem.name}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveGame} disabled={isLoading}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setGameDialogOpen(true)}
                        className="w-full"
                        disabled={isLoading}
                    >
                        Обрати систему
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <Label>Кімната</Label>
                {selectedRoom ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <div
                            className="w-6 h-6 rounded border-2 border-border flex-shrink-0"
                            style={{ backgroundColor: selectedRoom.color }}
                        />
                        <p className="flex-1 font-semibold">{selectedRoom.name}</p>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveRoom} disabled={isLoading}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRoomDialogOpen(true)}
                        className="w-full"
                        disabled={isLoading}
                    >
                        Призначити кімнату
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <Label>
                    Категорії <span className="text-destructive">*</span>
                </Label>
                {selectedCategories.length > 0 ? (
                    <div className="space-y-2">
                        {selectedCategories.map((category) => (
                            <div key={category.categoryId} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <p className="flex-1 font-semibold">{category.name}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCategory(category.categoryId)}
                                    disabled={isLoading}
                                    className="cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryDialogOpen(true)}
                            className="w-full cursor-pointer"
                            disabled={isLoading}
                        >
                            Змінити категорії
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCategoryDialogOpen(true)}
                        className="w-full cursor-pointer"
                        disabled={isLoading}
                    >
                        Обрати категорії
                    </Button>
                )}
                {errors.categoryIds && <p className="text-sm text-destructive">{errors.categoryIds}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button
                    type="button"
                    className="cursor-pointer bg-transparent"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Скасувати
                </Button>
                <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Створити" : "Зберегти"}
                </Button>
            </div>

            <GameSelectionDialog
                open={gameDialogOpen}
                onOpenChange={setGameDialogOpen}
                onConfirm={handleGameSelection}
                initialGameId={selectedGame?.gameId}
                initialSystemId={selectedSystem?.systemId}
            />

            <CategorySelectionDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                onConfirm={handleCategorySelection}
                initialCategoryIds={selectedCategories.map((c) => c.categoryId)}
            />

            <RoomSelectionDialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen} onConfirm={handleRoomSelection} />
        </form>
    )
}
