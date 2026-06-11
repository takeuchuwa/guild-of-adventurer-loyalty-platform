"use client"

import { useEffect, useState, useRef } from "react"
import { Layout } from "@/components/layout/layout"
import { GameForm } from "@/components/games/game-form"
import { getGameById, updateGame } from "@/components/games/api/api"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import type { Game } from "@/components/games/types/game"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { SystemsTable } from "@/components/games/systems/systems-table.tsx"
import type { CustomColumnDef } from "@/types/table"
import type { System } from "@/components/games/systems/types/system"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SystemForm } from "@/components/games/systems/system-form"
import { createGameSystem, updateGameSystem, deleteGameSystem } from "@/components/games/systems/api/api"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { Button } from "@/components/ui/button"

export default function GamesEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [game, setGame] = useState<Game | null>(null)
    const [isFetching, setIsFetching] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    const [systemDialogOpen, setSystemDialogOpen] = useState(false)
    const [systemDialogMode, setSystemDialogMode] = useState<"create" | "edit">("create")
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null)
    const [isSystemLoading, setIsSystemLoading] = useState(false)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [systemToDelete, setSystemToDelete] = useState<System | null>(null)

    const loadSystemsRef = useRef<(() => Promise<void>) | null>(null)

    useEffect(() => {
        const loadGame = async () => {
            if (!id) {
                toast.error("ID гри не знайдено")
                navigate("/games")
                return
            }

            setIsFetching(true)
            try {
                const data = await getGameById(id)
                setGame(data)
            } catch (error) {
                console.error("Error loading game:", error)
                toast.error("Помилка при завантаженні гри")
                navigate("/games")
            } finally {
                setIsFetching(false)
            }
        }

        loadGame()
    }, [id, navigate])

    const handleSubmit = async (data: { name: string; description?: string }) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateGame(id, data)
            toast.success("Ігрову систему успішно оновлено")
            navigate("/games")
        } catch (error: any) {
            console.error("Error updating game:", error)
            if (error.message === "Гра з такою назвою вже існує" || error.message === "Ігрова система з такою назвою вже існує") {
                toast.error(error.message)
            } else {
                toast.error("Помилка при оновленні ігрової системи")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/games")
    }

    const handleCreateSystem = () => {
        setSystemDialogMode("create")
        setSelectedSystem(null)
        setSystemDialogOpen(true)
    }

    const handleEditSystem = (system: System) => {
        setSystemDialogMode("edit")
        setSelectedSystem(system)
        setSystemDialogOpen(true)
    }

    const handleDeleteSystem = (system: System) => {
        setSystemToDelete(system)
        setDeleteDialogOpen(true)
    }

    const handleSystemSubmit = async (data: { name: string; description?: string }) => {
        if (!id) return

        setIsSystemLoading(true)
        try {
            if (systemDialogMode === "create") {
                await createGameSystem(id, data)
                toast.success("Варіант правил успішно створено")
            } else if (selectedSystem?.systemId) {
                await updateGameSystem(id, selectedSystem.systemId, data)
                toast.success("Варіант правил успішно оновлено")
            }
            setSystemDialogOpen(false)
            if (loadSystemsRef.current) await loadSystemsRef.current()
        } catch (error: any) {
            console.error("Error saving system:", error)
            if (error.message === "Система з такою назвою вже існує" || error.message === "Варіант правил з такою назвою вже існує") {
                toast.error(error.message)
            } else {
                toast.error(systemDialogMode === "create" ? "Помилка при створенні варіанта правил" : "Помилка при оновленні варіанта правил")
            }
        } finally {
            setIsSystemLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!id || !systemToDelete?.systemId) return

        try {
            await deleteGameSystem(id, systemToDelete.systemId)
            toast.success("Варіант правил успішно видалено")
            setDeleteDialogOpen(false)
            if (loadSystemsRef.current) await loadSystemsRef.current()
        } catch (error: any) {
            console.error("Error deleting system:", error)
            if (error.message === "Не можна видалити систему, яка використовується" || error.message === "Не можна видалити варіант правил, який використовується") {
                toast.error(error.message)
            } else {
                toast.error("Помилка при видаленні варіанта правил")
            }
        }
    }

    const systemColumns: CustomColumnDef<System>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Назва",
            size: 30,
        },
        {
            id: "description",
            accessorKey: "description",
            header: "Опис",
            size: 50,
            cell: ({ row }) => row.original.description || "—",
        },
        {
            id: "actions",
            header: "Дії",
            size: 20,
            cell: ({ row }) => (
                <div className="flex gap-2" data-no-select>
                    <Button variant="ghost" className="cursor-pointer" size="sm" onClick={() => handleEditSystem(row.original)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="cursor-pointer" size="sm" onClick={() => handleDeleteSystem(row.original)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ]

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Ігрові системи", path: "/games" },
                    { label: "Редагування", path: `/games/${id}` },
                ]}
            >
                <div className="container mx-auto py-10 max-w-2xl">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </div>
            </Layout>
        )
    }

    if (!game) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Ігрові системи", path: "/games" },
                { label: game.name, path: `/games/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">{game.name}</h1>
                    <p className="text-muted-foreground mt-2">Оновіть назву та опис ігрової системи</p>
                </div>

                <div className="bg-card border rounded-lg p-6 mb-8">
                    <GameForm
                        mode="edit"
                        initialData={game}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">Варіанти правил</h2>
                            <p className="text-muted-foreground mt-1">Редакції, системи або правила цієї гри</p>
                        </div>
                        <Button className="cursor-pointer" onClick={handleCreateSystem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Додати варіант
                        </Button>
                    </div>

                    <SystemsTable gameId={id!} columns={systemColumns} onLoadSystemsRef={loadSystemsRef} />
                </div>

                <Dialog open={systemDialogOpen} onOpenChange={setSystemDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{systemDialogMode === "create" ? "Додати варіант правил" : "Редагувати варіант правил"}</DialogTitle>
                        </DialogHeader>
                        <SystemForm
                            mode={systemDialogMode}
                            initialData={selectedSystem || undefined}
                            onSubmit={handleSystemSubmit}
                            onCancel={() => setSystemDialogOpen(false)}
                            isLoading={isSystemLoading}
                        />
                    </DialogContent>
                </Dialog>

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleConfirmDelete}
                    title="Видалити варіант правил"
                    description={`Ви впевнені, що хочете видалити варіант правил "${systemToDelete?.name}"? Ця дія незворотна.`}
                />
            </div>
        </Layout>
    )
}
