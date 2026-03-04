import type { CustomColumnDef } from "@/types/table"
import type { Room } from "../types/room"
import { Link } from "react-router-dom"

export const roomColumns: CustomColumnDef<Room>[] = [
    {
        id: "name",
        header: "Назва кімнати",
        accessorKey: "name",
        size: 40,
        cell: ({ row }) => (
            <Link to={`/rooms/${row.original.roomId}`} className="font-semibold hover:underline">
                {row.original.name}
            </Link>
        ),
    },
    {
        id: "color",
        header: "Колір",
        accessorKey: "color",
        size: 20,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: row.original.color }} />
                <span className="font-mono text-sm">{row.original.color}</span>
            </div>
        ),
    },
]
