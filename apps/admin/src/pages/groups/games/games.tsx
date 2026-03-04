"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { GameTable } from "@/components/games/games-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Game } from "@/components/games/types/game.tsx"
import { defaultColumns } from "@/components/games/columns/defaultColumns"
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteGame } from "@/components/games/api/api"
import { toast } from "sonner"

export default function GamesPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук за назвою...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [gameToDelete, setGameToDelete] = useState<Game | null>(null)
    const loadGamesRef = useRef<(() => Promise<void>) | null>(null)

    // Handlers for table actions
    const handleCreateGame = () => {
        console.log("Create new game")
        navigate("/games/create")
    }

    const handleEditGame = (selected: Game[]) => {
        const game = selected[0]
        if (game) {
            console.log("Edit game:", game)
            navigate(`/games/${game.gameId}`)
        }
    }

    const handleDeleteGame = (selected: Game[]) => {
        const game = selected[0]
        if (game) {
            setGameToDelete(game)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!gameToDelete) return

        try {
            await deleteGame(gameToDelete.gameId)
            toast.success("Систему успішно видалено")
            if (loadGamesRef.current) {
                await loadGamesRef.current()
            }
        } catch (error: any) {
            console.error("Error deleting game:", error)
            toast.error(error.message || "Помилка при видаленні гри")
        } finally {
            setGameToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Системи", path: "/games" }]}>
            <div className="container mx-auto py-10">
                <GameTable
                    columns={defaultColumns}
                    searchProperties={searchProperties}
                    title="Системи"
                    onLoadGamesRef={loadGamesRef}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateGame,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditGame,
                            isDisabled: (selected: Game[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteGame,
                            isDisabled: (selected: Game[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити систему"
                description="Ця дія незворотна. Гра буде видалена назавжди."
                itemName={gameToDelete?.name}
            />
        </Layout>
    )
}
