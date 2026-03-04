import type { CustomColumnDef } from "@/types/table"
import type { Promotion } from "@/components/promotions/types/promotion.ts"
import { CalendarDaysIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { formatDate } from "@/lib/format-utils.ts"
import { Badge } from "@/components/ui/badge.tsx"

export const promotionsColumns: CustomColumnDef<Promotion>[] = [
    {
        id: "name",
        header: "Назва",
        accessorKey: "name",
        size: 25,
        cell: ({ row }) => (
            <Link to={`/promotions/${row.original.promoId}`} className="font-semibold hover:underline">
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "code",
        header: "Код",
        accessorKey: "code",
        size: 15,
        cell: ({ row }) => {
            const code = row.original.code
            if (!code) return <span className="text-muted-foreground italic">—</span>
            return <span className="font-mono font-medium">{code}</span>
        },
    },
    {
        id: "mode",
        header: "Режим",
        accessorKey: "mode",
        size: 10,
        cell: ({ row }) => {
            const mode = row.original.mode
            return (
                <Badge variant={mode === "COUPON" ? "outline" : "secondary"}>
                    {mode === "COUPON" ? "Купон" : "Авто"}
                </Badge>
            )
        },
    },
    {
        id: "active",
        header: "Статус",
        accessorKey: "active",
        size: 10,
        cell: ({ row }) => {
            const active = row.original.active
            return (
                <Badge variant={active ? "default" : "destructive"}>
                    {active ? "Активний" : "Неактивний"}
                </Badge>
            )
        },
    },
    {
        id: "startDate",
        header: "Дата початку",
        accessorKey: "startDate",
        size: 15,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(row.original.startDate)}</span>
                </div>
            )
        },
    },
    {
        id: "endDate",
        header: "Дата завершення",
        accessorKey: "endDate",
        size: 15,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(row.original.endDate)}</span>
                </div>
            )
        },
    },
]
