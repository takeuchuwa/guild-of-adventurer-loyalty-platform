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
    "main_system_instruction": "Головна системна інструкція ШІ",
}

const entityLabelMap: Record<string, string> = {
    "promotion": "Промоакція",
    "activity": "Активність",
    "game": "Гра",
    "system": "Рольова система",
    "benefit": "Перевага",
    "prize": "Приз",
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
            const triggerKey = row.original.triggerKey;
            if (triggerKey === "main_system_instruction") {
                return <span className="font-medium">{triggerLabelMap[triggerKey]}</span>
            }
            if (triggerKey.startsWith("entity_system_instruction:")) {
                const entityName = triggerKey.split(":")[1];
                const entityLabel = entityLabelMap[entityName] || entityName;
                return <span className="font-medium">Інструкція ШІ для сутності ({entityLabel})</span>
            }
            const label = triggerLabelMap[triggerKey] || triggerKey;
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
