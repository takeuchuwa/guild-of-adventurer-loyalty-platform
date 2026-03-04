import { Layout } from "@/components/layout/layout"
import { ActivityForm } from "@/components/activities/activity-form"
import type { ActivityFormData } from "@/components/activities/activity-form"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { getActivityById, updateActivity } from "@/components/activities/api/activity-api.ts"
import { toast } from "sonner"
import type { Activity } from "@/components/activities/types/activity"
import { Loader2 } from "lucide-react"

export default function ActivityEdit() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [activity, setActivity] = useState<Activity | null>(null)

    useEffect(() => {
        const fetchActivity = async () => {
            if (!id) {
                toast.error("Activity ID not found")
                navigate("/activities")
                return
            }

            setIsFetching(true)
            try {
                const data = await getActivityById(id)
                setActivity(data)
            } catch (error) {
                console.error("Error fetching activity:", error)
                toast.error("Error loading activity")
                navigate("/activities")
            } finally {
                setIsFetching(false)
            }
        }

        fetchActivity()
    }, [id, navigate])

    const handleSubmit = async (data: ActivityFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateActivity(id, data)
            toast.success("Activity successfully updated")
            navigate("/activities")
        } catch (error) {
            console.error("Error updating activity:", error)
            const errorMessage = error instanceof Error ? error.message : "Error updating activity"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/activities")
    }

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Активності", path: "/activities" },
                    { label: "Редагувати активність", path: `/activities/${id}` },
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

    if (!activity) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Активності", path: "/activities" },
                { label: activity.name, path: `/activities/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Редагувати активність</h1>
                    <p className="text-muted-foreground mt-2">Оновіть інформацію активності</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <ActivityForm initialData={activity} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} mode="edit"/>
                </div>
            </div>
        </Layout>
    )
}
