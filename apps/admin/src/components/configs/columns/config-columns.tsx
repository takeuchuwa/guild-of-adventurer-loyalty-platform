import type { CustomColumnDef } from "@/types/table"
import type { LoyaltyConfig } from "@/components/configs/api/configs-api"
import { Badge } from "@/components/ui/badge.tsx"
import { format } from "date-fns"

function fmt(ts?: number | null) {
    if (!ts) return "—"
    try {
        return format(new Date(ts * 1000), "dd.MM.yyyy HH:mm")
    } catch {
        return String(ts)
    }
}

const triggerLabelMap: Record<string, string> = {
    "level_change": "Зміна рівня учасника",
    "activity_time_slot": "Часові слоти активностей",
}

export const configColumns: CustomColumnDef<LoyaltyConfig>[] = [
    {
        id: "triggerKey",
        header: "Тригер",
        accessorKey: "triggerKey",
        size: 20,
        minSize: 20,
        enableSorting: true,
        cell: ({ row }) => {
            const label = triggerLabelMap[row.original.triggerKey] || row.original.triggerKey;
            return <span className="font-medium">{label}</span>
        },
    },
    {
        id: "name",
        header: "Назва",
        accessorKey: "name",
        enableSorting: true,
        size: 35,
    },
    {
        id: "active",
        header: "Активний",
        accessorKey: "active",
        enableSorting: true,
        size: 10,
        minSize: 10,
        cell: ({ row }) => (row.original.active ? <Badge variant="default">Так</Badge> :
            <Badge variant="secondary">Ні</Badge>),
    },
    {
        id: "updatedAt",
        header: "Оновлено",
        accessorKey: "updatedAt",
        enableSorting: true,
        cell: ({ row }) => fmt(row.original.updatedAt),
    },
]
