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
import { RoomsTable } from "@/components/rooms/rooms-table"
import { roomColumns } from "@/components/rooms/columns/room-columns"
import type { Room } from "@/components/rooms/types/room"
import { Check } from "lucide-react"

interface RoomSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (roomId: string) => void
}

export function RoomSelectionDialog({ open, onOpenChange, onConfirm }: RoomSelectionDialogProps) {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    useEffect(() => {
        if (!open) {
            setSelectedRoom(null)
        }
    }, [open])

    const handleRoomSelection = (selected: Map<string, Room>) => {
        const room = Array.from(selected.values())[0]
        setSelectedRoom(room || null)
    }

    const handleConfirm = () => {
        if (selectedRoom) {
            onConfirm(selectedRoom.roomId)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Вибір кімнати</DialogTitle>
                    <DialogDescription>Оберіть кімнату для активності</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    <RoomsTable
                        columns={roomColumns}
                        selectionMode="single"
                        onSelectionChange={handleRoomSelection}
                    />
                </div>

                {selectedRoom && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Обрана кімната:</p>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded border-2 border-border" style={{ backgroundColor: selectedRoom.color }} />
                            <span className="font-semibold">{selectedRoom.name}</span>
                            <Check className="w-5 h-5 text-primary ml-auto" />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Скасувати
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedRoom}>
                        Підтвердити
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
