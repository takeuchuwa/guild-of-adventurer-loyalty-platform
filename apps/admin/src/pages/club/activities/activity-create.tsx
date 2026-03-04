import { Layout } from "@/components/layout/layout"
import { ActivityForm } from "@/components/activities/activity-form"
import type { ActivityFormData } from "@/components/activities/activity-form"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { createActivity } from "@/components/activities/api/activity-api.ts"
import { toast } from "sonner"

export default function ActivityCreate() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: ActivityFormData) => {
        setIsLoading(true)
        try {
            await createActivity(data)
            toast.success("Activity successfully created")
            navigate("/activities")
        } catch (error) {
            console.error("Error creating activity:", error)
            const errorMessage = error instanceof Error ? error.message : "Error creating activity"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/activities")
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Активності", path: "/activities" },
                { label: "Створити активність", path: "/activities/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Створити активність</h1>
                    <p className="text-muted-foreground mt-2">Заповніть форму для створення нової активності</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <ActivityForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} mode="create"/>
                </div>
            </div>
        </Layout>
    )
}
