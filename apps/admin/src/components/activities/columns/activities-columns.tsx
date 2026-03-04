import type { CustomColumnDef } from "@/types/table"
import type { Activity } from "@/components/activities/types/activity"
import type { Category } from "@/components/categories/types/category-types.tsx"
import { CalendarDaysIcon, Dice5Icon, ListIcon, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDate } from "@/lib/format-utils.ts"
import { Button } from "@/components/ui/button.tsx"

function formatDuration(startDate: number, endDate: number): string {
    const durationSeconds = endDate - startDate
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.floor((durationSeconds % 3600) / 60)

    if (hours > 0 && minutes > 0) {
        return `${hours} год ${minutes} хв`
    } else if (hours > 0) {
        return `${hours} год`
    } else {
        return `${minutes} хв`
    }
}

function isSameDay(startDate: number, endDate: number): boolean {
    const start = new Date(startDate * 1000)
    const end = new Date(endDate * 1000)

    return (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()
    )
}

export const activitiesColumns: CustomColumnDef<Activity>[] = [
    {
        id: "name",
        header: "Назва активності",
        accessorKey: "name",
        size: 20,
        cell: ({ row }) => (
            <Link to={`/activities/${row.original.activityId}`} className="font-semibold hover:underline">
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "price",
        header: "Ціна",
        accessorKey: "price",
        size: 10,
        minSize: 10,
        cell: ({ row }) => {
            const price = row.original.price ?? 0
            const formatted = price.toLocaleString("uk-UA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })

            return (
                <Button variant="default" className="pointer-events-none font-semibold w-22 h-6" size="sm">
                    {formatted} ₴
                </Button>
            )
        },
    },
    {
        id: "startDate",
        header: "Дата початку",
        accessorKey: "startDate",
        size: 10,
        minSize: 10,
        cell: ({ row }) => {
            const startDate = row.original.startDate
            return (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(startDate)}</span>
                </div>
            )
        },
    },
    {
        id: "endDate",
        header: "Тривалість / Завершення",
        accessorKey: "endDate",
        size: 10,
        minSize: 10,
        cell: ({ row }) => {
            const startDate = row.original.startDate
            const endDate = row.original.endDate

            if (isSameDay(startDate, endDate)) {
                // Show duration for same-day activities
                return (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(startDate, endDate)}</span>
                    </div>
                )
            } else {
                // Show end date for multi-day activities
                return (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>{formatDate(endDate)}</span>
                    </div>
                )
            }
        },
    },
    {
        id: "game",
        header: "Гра",
        accessorKey: "game",
        size: 20,
        cell: ({ row }) => {
            const game = row.original.game
            const system = row.original.system

            if (!game) {
                return <span className="text-muted-foreground italic">—</span>
            }

            return (
                <div className="line-clamp-2 flex items-center gap-2">
                    <Dice5Icon className="w-4 h-4 text-muted-foreground" />
                    <Link to={`/games/${game.gameId}`} className="text-primary hover:underline">
                        {game.name}
                    </Link>
                    {system?.name && <span className="text-muted-foreground"> ({system.name})</span>}
                </div>
            )
        },
    },
    {
        id: "overridePoints",
        header: "Бали досвіду",
        accessorKey: "overridePoints",
        size: 10,
        minSize: 10,
        cell: ({ row }) => {
            const overridePoints = row.original.overridePoints
            const price = row.original.price
            const fallback = Math.floor(price * 0.1)

            if (overridePoints !== null && overridePoints !== undefined) {
                return (
                    <Button variant="default" className="pointer-events-none font-semibold w-8 h-6" size="sm">
                        {overridePoints}
                    </Button>
                )
            }

            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="pointer-events-none font-semibold w-8 h-6 text-muted-foreground justify-center"
                    >
                        {fallback}
                    </Button>
                    <span className="text-muted-foreground text-sm">(10% ціни)</span>
                </div>
            )
        },
    },
    {
        id: "categories",
        header: "Категорії",
        accessorKey: "categories",
        size: 15,
        minSize: 15,
        cell: ({ row }) => {
            const categories = row.original.categories as Category[] | undefined
            if (!categories || categories.length === 0) return <span className="text-muted-foreground italic">—</span>

            return (
                <div className="flex items-center gap-2">
                    <ListIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-x-1">
                        {categories.map((c, i) => (
                            <span key={c.categoryId} className="inline-flex items-center gap-1">
                <Link to={`/categories/${c.categoryId}`} className="text-primary hover:underline">
                  {c.name}
                </Link>
                                {i < categories.length - 1 && ","}
              </span>
                        ))}
                    </div>
                </div>
            )
        },
    },
    {
        id: "room",
        header: "Кімната",
        accessorKey: "room",
        size: 15,
        cell: ({ row }) => {
            const room = row.original.room

            if (!room) {
                return <span className="text-muted-foreground italic">—</span>
            }

            return (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-border flex-shrink-0" style={{ backgroundColor: room.color }} />
                    <span className="font-medium">{room.name}</span>
                </div>
            )
        },
    },
]
