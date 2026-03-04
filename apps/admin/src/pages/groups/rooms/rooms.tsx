"use client"

import { Layout } from "@/components/layout/layout"
import { RoomsTable } from "@/components/rooms/rooms-table"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search"
import type { Room } from "@/components/rooms/types/room"
import { roomColumns } from "@/components/rooms/columns/room-columns"
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteRoom } from "@/components/rooms/api/room-api"
import { toast } from "sonner"

export default function RoomsPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук за назвою кімнати...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
    const loadRoomsRef = useRef<(() => Promise<void>) | null>(null)

    const handleCreateRoom = () => {
        navigate("/rooms/create")
    }

    const handleEditRoom = (selected: Room[]) => {
        const room = selected[0]
        if (room) {
            navigate(`/rooms/${room.roomId}`)
        }
    }

    const handleDeleteRoom = (selected: Room[]) => {
        const room = selected[0]
        if (room) {
            setRoomToDelete(room)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!roomToDelete) return

        try {
            await deleteRoom(roomToDelete.roomId)
            toast.success("Кімнату успішно видалено")
            if (loadRoomsRef.current) {
                await loadRoomsRef.current()
            }
        } catch (error: any) {
            console.error("Error deleting room:", error)
            toast.error(error.message || "Помилка при видаленні кімнати")
        } finally {
            setRoomToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Кімнати", path: "/rooms" }]}>
            <div className="container mx-auto py-10">
                <RoomsTable
                    columns={roomColumns}
                    searchProperties={searchProperties}
                    title="Кімнати"
                    onLoadRoomsRef={loadRoomsRef}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateRoom,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditRoom,
                            isDisabled: (selected: Room[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteRoom,
                            isDisabled: (selected: Room[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити кімнату"
                description="Ця дія незворотна. Кімната буде видалена назавжди."
                itemName={roomToDelete?.name}
            />
        </Layout>
    )
}
