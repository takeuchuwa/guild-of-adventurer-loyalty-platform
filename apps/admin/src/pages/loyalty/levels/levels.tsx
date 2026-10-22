"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { LevelsTable } from "@/components/levels/levels-table"
import { levelColumns } from "@/components/levels/columns/level-columns"
import { Pencil, PlusCircle, RefreshCw, Trash2 } from "lucide-react"
import type { Level } from "@/components/levels/types/level-types"
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteLevel } from "@/components/levels/api/level-api"
import { refreshLevels } from "@/hooks/use-levels"
import { toast } from "sonner"

export default function LevelsPage() {
    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [levelToDelete, setLevelToDelete] = useState<Level | null>(null)
    const [isRefreshingCache, setIsRefreshingCache] = useState(false)
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

    /**
     * The ladder is cached in localStorage for badges and filters across the app;
     * anything that changes it here has to drop that cache.
     */
    const handleRefreshCache = async () => {
        setIsRefreshingCache(true)
        try {
            await refreshLevels()
            if (loadLevelsRef.current) {
                await loadLevelsRef.current()
            }
            toast.success("Кеш рівнів оновлено")
        } catch (error: any) {
            console.error("Error refreshing levels cache:", error)
            toast.error(error.message || "Помилка при оновленні кешу рівнів")
        } finally {
            setIsRefreshingCache(false)
        }
    }

    const confirmDelete = async () => {
        if (!levelToDelete) return

        try {
            await deleteLevel(levelToDelete.levelId)
            await refreshLevels().catch(() => { })
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
            <div className="p-7">
                <LevelsTable
                    selectionMode="single"
                    columns={levelColumns}
                    title="Рівні лояльності"
                    onLoadLevelsRef={loadLevelsRef}
                    storageKey="levels"
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateLevel,
                        },
                        {
                            label: isRefreshingCache ? "Оновлення…" : "Оновити кеш",
                            icon: <RefreshCw className={`mr-0.5 h-4 w-4 ${isRefreshingCache ? "animate-spin" : ""}`} />,
                            onClick: handleRefreshCache,
                            scope: "global",
                            variant: "outline",
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
