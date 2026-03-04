"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { LevelsTable } from "@/components/levels/levels-table"
import { levelColumns } from "@/components/levels/columns/level-columns"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { Level } from "@/components/levels/types/level-types"
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteLevel } from "@/components/levels/api/level-api"
import { toast } from "sonner"

export default function LevelsPage() {
    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [levelToDelete, setLevelToDelete] = useState<Level | null>(null)
    const loadLevelsRef = useRef<(() => Promise<void>) | null>(null)

    const handleCreateLevel = () => {
        navigate("/levels/create")
    }

    const handleEditLevel = (selected: Level[]) => {
        const level = selected[0]
        if (level) {
            navigate(`/levels/${level.levelId}`)
        }
    }

    const handleDeleteLevel = (selected: Level[]) => {
        const level = selected[0]
        if (level) {
            setLevelToDelete(level)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!levelToDelete) return

        try {
            await deleteLevel(levelToDelete.levelId)
            toast.success("Рівень успішно видалено")
            if (loadLevelsRef.current) {
                await loadLevelsRef.current()
            }
        } catch (error: any) {
            console.error("Error deleting level:", error)
            toast.error(error.message || "Помилка при видаленні рівня")
        } finally {
            setLevelToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Рівні", path: "/levels" }]}>
            <div className="container mx-auto py-10">
                <LevelsTable
                    selectionMode="single"
                    columns={levelColumns}
                    title="Рівні лояльності"
                    onLoadLevelsRef={loadLevelsRef}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateLevel,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditLevel,
                            isDisabled: (selected: Level[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteLevel,
                            isDisabled: (selected: Level[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити рівень"
                description="Ця дія незворотна. Рівень буде видалено назавжди."
                itemName={levelToDelete?.name}
            />
        </Layout>
    )
}
