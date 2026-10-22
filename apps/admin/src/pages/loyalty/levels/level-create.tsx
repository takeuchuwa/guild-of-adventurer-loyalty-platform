"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { LevelForm } from "@/components/levels/level-form.tsx"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { createLevel } from "@/components/levels/api/level-api.ts"
import { toast } from "sonner"
import { refreshLevels } from "@/hooks/use-levels"
import type {LevelFormData} from "@/components/levels/types/level-types.tsx";

export default function LevelCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: LevelFormData) => {
        setIsLoading(true)
        try {
            await createLevel(data)
            await refreshLevels().catch(() => { })
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
            <LevelForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
        </Layout>
    )
}
