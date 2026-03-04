import type { CustomColumnDef } from "@/types/table"
import type { Level } from "../types/level-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { CoinsIcon, PercentIcon } from "lucide-react"

export const levelColumns: CustomColumnDef<Level>[] = [
    {
        id: "levelId",
        header: "ID",
        accessorKey: "levelId",
        size: 3,
        minSize: 3,
        cell: ({ row }) => <div className="font-mono font-semibold text-muted-foreground">{row.original.levelId}</div>,
    },
    {
        id: "name",
        header: "Назва",
        accessorKey: "name",
        size: 20,
        cell: ({ row }) => (
            <Link to={`/levels/${row.original.levelId}`} className="font-semibold hover:underline flex items-center gap-2">
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "minPoints",
        header: "Кількість балів",
        accessorKey: "minPoints",
        size: 10,
        minSize: 10,
        cell: ({ row }) => (
            <Button variant="default" className="pointer-events-none font-semibold w-16 h-6" size="sm">
                {row.original.minPoints}
            </Button>
        ),
    },

    {
        id: "defaultLevel",
        header: "За замовчуванням",
        accessorKey: "defaultLevel",
        size: 12,
        minSize: 12,
        cell: ({ row }) => {
            const isDefault = row.original.defaultLevel
            if (!isDefault) {
                return <span className="text-muted-foreground italic">—</span>
            }
            return (
                <div className="flex items-center gap-2">
                    <Badge variant="default">Так</Badge>
                </div>
            )
        },
    },
    {
        id: "sortOrder",
        header: "Порядок",
        accessorKey: "sortOrder",
        size: 8,
        minSize: 8,
        cell: ({ row }) => <div className="font-medium">{row.original.sortOrder}</div>,
    },
]
