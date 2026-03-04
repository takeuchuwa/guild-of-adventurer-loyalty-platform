"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { LevelForm } from "@/components/levels/level-form.tsx"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { fetchLevel, updateLevel } from "@/components/levels/api/level-api.ts"
import { toast } from "sonner"
import type { Level, LevelFormData } from "@/components/levels/types/level-types.tsx"
import { Loader2 } from "lucide-react"
import { PromotionsTable } from "@/components/promotions/promotions-table.tsx"
import { promotionsColumns } from "@/components/promotions/columns/columns.tsx"

export default function LevelEditPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [level, setLevel] = useState<Level | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            loadLevel(id)
        }
    }, [id])

    const loadLevel = async (levelId: string) => {
        try {
            const data = await fetchLevel(levelId)
            setLevel(data)
        } catch (error) {
            console.error("Error loading level:", error)
            toast.error("Помилка при завантаженні рівня")
            navigate("/levels")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (data: LevelFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateLevel(id, data)
            toast.success("Рівень успішно оновлено")
            navigate("/levels")
        } catch (error) {
            console.error("Error updating level:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при оновленні рівня"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/levels")
    }

    if (loading) {
        return (
            <Layout breadcrumbs={[{ label: "Рівні", path: "/levels" }]}>
                <div className="container mx-auto py-10 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!level) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Рівні", path: "/levels" },
                { label: level.name, path: `/levels/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Редагувати рівень</h1>
                    <p className="text-muted-foreground mt-2">Оновіть інформацію про рівень лояльності</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <LevelForm
                        mode="edit"
                        initialData={level}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                </div>

                <div className="bg-card border rounded-lg p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Промоакції рівня</h2>
                    <PromotionsTable
                        columns={promotionsColumns}
                        staticData={(level as any).promotions || []}
                    />
                </div>
            </div>
        </Layout>
    )
}
