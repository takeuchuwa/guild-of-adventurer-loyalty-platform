import { Layout } from "@/components/layout/layout"
import { GameForm } from "@/components/games/game-form"
import { createGame } from "@/components/games/api/api"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useState } from "react"

export default function GamesCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: { name: string; description?: string }) => {
        setIsLoading(true)
        try {
            await createGame(data)
            toast.success("Систему успішно створено")
            navigate("/games")
        } catch (error: any) {
            console.error("Error creating game:", error)
            if (error.message === "Гра з такою назвою вже існує") {
                toast.error(error.message)
            } else {
                toast.error("Помилка при створенні гри")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/games")
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Системи", path: "/games" },
                { label: "Створити систему", path: "/games/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Створити систему</h1>
                    <p className="text-muted-foreground mt-2">Заповніть форму для створення нової системи</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <GameForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
                </div>
            </div>
        </Layout>
    )
}
