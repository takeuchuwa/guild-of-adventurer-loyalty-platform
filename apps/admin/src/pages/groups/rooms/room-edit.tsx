"use client"

import { Layout } from "@/components/layout/layout"
import { RoomForm } from "@/components/rooms/room-form"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { getRoomById, updateRoom } from "@/components/rooms/api/room-api"
import type { RoomFormData } from "@/components/rooms/types/validations/room-validation"
import { useEffect, useState } from "react"
import type { Room } from "@/components/rooms/types/room"
import { Loader2 } from "lucide-react"

export default function RoomEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [room, setRoom] = useState<Room | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)

    useEffect(() => {
        if (id) {
            getRoomById(id)
                .then(setRoom)
                .catch((error) => {
                    console.error("Error fetching room:", error)
                    toast.error("Помилка при завантаженні кімнати")
                    navigate("/rooms")
                })
                .finally(() => setIsFetching(false))
        }
    }, [id, navigate])

    const handleSubmit = async (data: RoomFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateRoom(id, data)
            toast.success("Кімнату успішно оновлено")
            navigate("/rooms")
        } catch (error: any) {
            console.error("Error updating room:", error)
            toast.error(error.message || "Помилка при оновленні кімнати")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/rooms")
    }

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Кімнати", path: "/rooms" },
                    { label: "Редагувати кімнату", path: `/rooms/${id}` },
                ]}
            >
                <div className="container mx-auto py-10 max-w-2xl flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!room) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Кімнати", path: "/rooms" },
                { label: room.name, path: `/rooms/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <h1 className="text-3xl font-bold mb-6">Редагувати кімнату</h1>
                <RoomForm
                    mode="edit"
                    initialData={room}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                />
            </div>
        </Layout>
    )
}
