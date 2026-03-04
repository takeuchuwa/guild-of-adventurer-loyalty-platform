"use client"

import { Layout } from "@/components/layout/layout"
import { RoomForm } from "@/components/rooms/room-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { createRoom } from "@/components/rooms/api/room-api"
import type { RoomFormData } from "@/components/rooms/types/validations/room-validation"
import { useState } from "react"

export default function RoomCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: RoomFormData) => {
        setIsLoading(true)
        try {
            await createRoom(data)
            toast.success("Кімнату успішно створено")
            navigate("/rooms")
        } catch (error: any) {
            console.error("Error creating room:", error)
            toast.error(error.message || "Помилка при створенні кімнати")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/rooms")
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Кімнати", path: "/rooms" },
                { label: "Створити кімнату", path: "/rooms/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <h1 className="text-3xl font-bold mb-6">Створити кімнату</h1>
                <RoomForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
            </div>
        </Layout>
    )
}
