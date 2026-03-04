"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { LevelForm } from "@/components/levels/level-form.tsx"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { createLevel } from "@/components/levels/api/level-api.ts"
import { toast } from "sonner"
import type {LevelFormData} from "@/components/levels/types/level-types.tsx";

export default function LevelCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: LevelFormData) => {
        setIsLoading(true)
        try {
            await createLevel(data)
            toast.success("Рівень успішно створено")
            navigate("/levels")
        } catch (error) {
            console.error("Error creating level:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при створенні рівня"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/levels")
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Рівні", path: "/levels" },
                { label: "Створити рівень", path: "/levels/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Створити рівень</h1>
                    <p className="text-muted-foreground mt-2">Заповніть форму для створення нового рівня лояльності</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <LevelForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
                </div>
            </div>
        </Layout>
    )
}
