import { Layout } from "@/components/layout/layout"
import { ActivityForm } from "@/components/activities/activity-form"
import type { ActivityFormData } from "@/components/activities/activity-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { createActivity } from "@/components/activities/api/activity-api.ts"
import { fetchConfigs } from "@/components/configs/api/configs-api.ts"
import type { ActivityTimeSlotConfig } from "@/components/configs/api/configs-api"
import { toast } from "sonner"
import type { Activity } from "@/components/activities/types/activity"

export default function ActivityCreate() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)

    const initialName = searchParams.get("name") || ""
    const returnTo = searchParams.get("returnTo")

    const [hasCalculatedDates, setHasCalculatedDates] = useState(false)
    const [calculatedDates, setCalculatedDates] = useState<{ startDate: number; endDate: number } | null>(null)

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                type ParsedSlot = {
                    startH: number;
                    startM: number;
                    endH: number;
                    endM: number;
                    startMinutesTotal: number;
                }

                // Check cache first
                const cachedSlots = localStorage.getItem("activityTimeSlotConfigs")
                let slots: ParsedSlot[] = []

                if (cachedSlots) {
                    slots = JSON.parse(cachedSlots)
                } else {
                    const response = await fetchConfigs({ triggerKey: "activity_time_slot" as any, includeCount: false, pageSize: 100 })
                    const configs = response.data
                        .filter(c => c.active && c.config)
                        .map(c => c.config as ActivityTimeSlotConfig)

                    // Parse out slots and sort them by start time
                    slots = configs.map(c => {
                        const [startH, startM] = c.startHour.split(':').map(Number)
                        const [endH, endM] = c.endHour.split(':').map(Number)
                        return {
                            startH, startM, endH, endM,
                            startMinutesTotal: startH * 60 + startM
                        }
                    }).sort((a, b) => a.startMinutesTotal - b.startMinutesTotal)

                    localStorage.setItem("activityTimeSlotConfigs", JSON.stringify(slots))
                }
                if (slots.length === 0) {
                    // Fallback to default if no configs
                    const now = new Date()
                    const startDate = Math.floor(now.getTime() / 1000)
                    const endDate = startDate + 3600
                    setCalculatedDates({ startDate, endDate })
                    setHasCalculatedDates(true)
                    return
                }

                const now = new Date()
                const currentMinutesTotal = now.getHours() * 60 + now.getMinutes()

                // Find next slot today
                let nextSlot = slots.find(s => s.startMinutesTotal > currentMinutesTotal)

                let targetDate = new Date()

                if (!nextSlot) {
                    // Passed all slots -> fallback to the LAST available slot for the current day
                    nextSlot = slots[slots.length - 1]
                }

                const startDate = new Date(targetDate)
                startDate.setHours(nextSlot.startH, nextSlot.startM, 0, 0)

                const endDate = new Date(targetDate)
                // If end hour is earlier than start hour on the same day, it likely spans into the next day
                if (nextSlot.endH < nextSlot.startH || (nextSlot.endH === nextSlot.startH && nextSlot.endM < nextSlot.startM)) {
                    endDate.setDate(endDate.getDate() + 1)
                }
                endDate.setHours(nextSlot.endH, nextSlot.endM, 0, 0)

                setCalculatedDates({
                    startDate: Math.floor(startDate.getTime() / 1000),
                    endDate: Math.floor(endDate.getTime() / 1000)
                })
                setHasCalculatedDates(true)
            } catch (err) {
                console.error("Error loading configs for time slots", err)
                // Fallback
                const now = new Date()
                setCalculatedDates({
                    startDate: Math.floor(now.getTime() / 1000),
                    endDate: Math.floor(now.getTime() / 1000) + 3600
                })
                setHasCalculatedDates(true)
            }
        }

        loadConfigs()
    }, [])

    const initialData = useMemo(() => {
        const base = {
            name: initialName || "",
            price: 0,
            overridePoints: undefined,
            categoryIds: [],
        } as unknown as Activity

        if (calculatedDates) {
            base.startDate = calculatedDates.startDate
            base.endDate = calculatedDates.endDate
        }

        return base
    }, [initialName, calculatedDates])

    const handleSubmit = async (data: ActivityFormData, isCreateAndAdd?: boolean) => {
        setIsLoading(true)
        try {
            const created = await createActivity({
                ...data,
                description: data.description || "",
                overridePoints: data.overridePoints === null ? undefined : data.overridePoints,
                gameId: data.gameId || undefined,
                systemId: data.systemId || undefined,
                roomId: data.roomId || undefined,
                name: data.name,
                price: data.price,
                startDate: data.startDate,
                endDate: data.endDate,
                categoryIds: data.categoryIds,
            })
            toast.success("Activity successfully created")

            if (isCreateAndAdd) {
                navigate("/checkout", { state: { addItem: { id: created.activityId, type: "activity" } } })
            } else {
                navigate("/activities")
            }
        } catch (error) {
            console.error("Error creating activity:", error)
            const errorMessage = error instanceof Error ? error.message : "Error creating activity"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        if (returnTo === "checkout") {
            navigate("/checkout")
        } else {
            navigate("/activities")
        }
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
                    {hasCalculatedDates ? (
                        <ActivityForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            mode="create"
                            initialData={initialData}
                            showCreateAndAdd={returnTo === "checkout"}
                        />
                    ) : (
                        <div className="flex items-center justify-center p-8">
                            <span className="text-muted-foreground animate-pulse">Завантаження налаштувань часу...</span>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
