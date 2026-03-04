"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ActivityTable } from "@/components/activities/activities-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Activity } from "@/components/activities/types/activity.tsx"
import { activitiesColumns } from "@/components/activities/columns/activities-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useMemo } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteActivity } from "@/components/activities/api/activity-api.ts"
import { toast } from "sonner"
import { DateFilter } from "@/components/activities/filters/date-filter"
import type { DataTableFilter } from "@/components/table/data-table"

export default function ActivitiesPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук активності...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
    const loadActivitiesRef = useRef<(() => Promise<void>) | null>(null)

    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return today
    })
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    const filterParams = useMemo(() => {
        const params: { startDate?: number; endDate?: number } = {}

        if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            params.startDate = Math.floor(start.getTime() / 1000)
        }

        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            params.endDate = Math.floor(end.getTime() / 1000)
        }

        return params
    }, [startDate, endDate])

    const filters: DataTableFilter[] = useMemo(
        () => [
            {
                component: (
                    <DateFilter
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                ),
            },
        ],
        [startDate, endDate],
    )

    // Handlers for table actions
    const handleCreateActivity = () => {
        navigate("/activities/create")
    }

    const handleEditActivity = (selected: Activity[]) => {
        const activity = selected[0]
        if (activity) {
            navigate(`/activities/${activity.activityId}`)
        }
    }

    const handleDeleteActivity = (selected: Activity[]) => {
        const activity = selected[0]
        if (activity) {
            setActivityToDelete(activity)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!activityToDelete) return

        try {
            await deleteActivity(activityToDelete.activityId)
            toast.success("Активність успішно видалено")
            if (loadActivitiesRef.current) {
                await loadActivitiesRef.current()
            }
        } catch (error: any) {
            toast.error(error.message || "Помилка при видаленні активності")
        } finally {
            setDeleteDialogOpen(false)
            setActivityToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Активності", path: "/activities" }]}>
            <div className="container mx-auto py-10">
                <ActivityTable
                    columns={activitiesColumns}
                    searchProperties={searchProperties}
                    title="Сесії / Активності"
                    onLoadActivitiesRef={loadActivitiesRef}
                    filters={filters}
                    filterParams={filterParams}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateActivity,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditActivity,
                            isDisabled: (selected: Activity[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteActivity,
                            isDisabled: (selected: Activity[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити активність"
                description="Ви впевнені, що хочете видалити цю активність? Цю дію не можна скасувати."
                itemName={activityToDelete?.name}
            />
        </Layout>
    )
}
