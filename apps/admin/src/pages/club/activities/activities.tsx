"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ActivityTable } from "@/components/activities/activities-table.tsx"
import { Pencil, PlusCircle, Trash2, Sliders } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Activity } from "@/components/activities/types/activity.tsx"
import { activitiesColumns } from "@/components/activities/columns/activities-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useMemo, useCallback } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { BulkUpdateDialog } from "@/components/shared/dialogs/bulk-update-dialog"
import { deleteActivity, bulkUpdateActivities } from "@/components/activities/api/activity-api.ts"
import { toast } from "sonner"
import { DateFilter } from "@/components/activities/filters/date-filter"
import type { DataTableFilter } from "@/components/table/data-table"
import { CategoryFilter } from "@/components/shared/filters/category-filter"
import { GameFilter } from "@/components/shared/filters/game-filter"

export default function ActivitiesPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук активності...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [activitiesToDelete, setActivitiesToDelete] = useState<Activity[]>([])
    const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
    const [selectedActivities, setSelectedActivities] = useState<Activity[]>([])
    const [tableKey, setTableKey] = useState(0)
    const loadActivitiesRef = useRef<(() => Promise<void>) | null>(null)

    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return today
    })
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    // Filter states
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
    const [gameId, setGameId] = useState<string | undefined>(undefined)

    const filterParams = useMemo(() => {
        const params: { startDate?: number; endDate?: number; categoryId?: string; gameId?: string } = {}

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

        if (categoryId) {
            params.categoryId = categoryId
        }

        if (gameId) {
            params.gameId = gameId
        }

        return params
    }, [startDate, endDate, categoryId, gameId])

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
            {
                component: (
                    <CategoryFilter
                        kind="ACTIVITY"
                        selectedCategoryId={categoryId}
                        onChange={setCategoryId}
                    />
                ),
            },
            {
                component: (
                    <GameFilter
                        selectedGameId={gameId}
                        onChange={setGameId}
                    />
                ),
            },
        ],
        [startDate, endDate, categoryId, gameId],
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
        if (selected.length > 0) {
            setActivitiesToDelete(selected)
            setDeleteDialogOpen(true)
        }
    }

    const handleBulkUpdate = () => {
        if (selectedActivities.length >= 2) {
            setBulkUpdateDialogOpen(true)
        }
    }

    const handleConfirmBulkUpdate = async (data: { price?: number; overridePoints?: number | null }) => {
        try {
            const ids = selectedActivities.map((a) => a.activityId)
            await bulkUpdateActivities({ ids, ...data })
            toast.success("Активності успішно оновлено")
            // Reset selection by updating tableKey
            setTableKey((prev) => prev + 1)
            setSelectedActivities([])
        } catch (error: any) {
            console.error("Error updating activities in bulk:", error)
            toast.error(error.message || "Помилка при груповому оновленні")
        }
    }

    const handleSelectionChange = useCallback((selectedMap: Map<string, Activity>) => {
        setSelectedActivities(Array.from(selectedMap.values()))
    }, [])


    const confirmDelete = async () => {
        if (activitiesToDelete.length === 0) return

        try {
            const ids = activitiesToDelete.map((a) => a.activityId).join(",")
            await deleteActivity(ids)
            toast.success(activitiesToDelete.length > 1 ? "Активності успішно видалено" : "Активність успішно видалено")
            // Reset selection by updating tableKey
            setTableKey((prev) => prev + 1)
            setSelectedActivities([])
        } catch (error: any) {
            toast.error(error.message || "Помилка при видаленні активності")
        } finally {
            setDeleteDialogOpen(false)
            setActivitiesToDelete([])
        }
    }

    const tableActions = useMemo(() => {
        const selectedCount = selectedActivities.length
        return [
            {
                label: "Додати",
                icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                onClick: handleCreateActivity,
                variant: selectedCount === 0 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Редагувати",
                icon: <Pencil className="mr-0.5 h-4 w-4" />,
                onClick: handleEditActivity,
                isDisabled: (selected: Activity[]) => selected.length !== 1,
                variant: selectedCount === 1 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Групове оновлення",
                icon: <Sliders className="mr-0.5 h-4 w-4" />,
                onClick: handleBulkUpdate,
                isDisabled: (selected: Activity[]) => selected.length < 2,
                variant: selectedCount >= 2 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Видалити",
                icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                onClick: handleDeleteActivity,
                isDisabled: (selected: Activity[]) => selected.length < 1,
                variant: "destructiveOutline" as const,
            },
        ]
    }, [selectedActivities])

    return (
        <Layout breadcrumbs={[{ label: "Активності", path: "/activities" }]}>
            <div className="p-7">
                <ActivityTable
                    key={tableKey}
                    columns={activitiesColumns}
                    searchProperties={searchProperties}
                    title="Сесії / Активності"
                    onLoadActivitiesRef={loadActivitiesRef}
                    filters={filters}
                    filterParams={filterParams}
                    storageKey="activities"
                    onSelectionChange={handleSelectionChange}
                    actions={tableActions}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title={activitiesToDelete.length > 1 ? "Видалити активності" : "Видалити активність"}
                description={activitiesToDelete.length > 1 ? "Ця дія незворотна. Обрані активності будуть видалені назавжди." : "Ця дія незворотна. Активність буде видалена назавжди."}
                itemName={activitiesToDelete.length === 1 ? activitiesToDelete[0]?.name : undefined}
                itemCount={activitiesToDelete.length}
            />

            <BulkUpdateDialog
                open={bulkUpdateDialogOpen}
                onOpenChange={setBulkUpdateDialogOpen}
                onConfirm={handleConfirmBulkUpdate}
                title="Масове оновлення активностей"
                description={`Виберіть показники, які хочете оновити для обраних активностей (${selectedActivities.length} шт.).`}
                count={selectedActivities.length}
            />
        </Layout>
    )
}

