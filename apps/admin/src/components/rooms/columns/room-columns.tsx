import type { CustomColumnDef } from "@/types/table"
import type { Room } from "../types/room"
import { Link } from "react-router-dom"
import { ExternalLink } from "lucide-react"

export const roomColumns: CustomColumnDef<Room>[] = [
    {
        id: "name",
        header: "Назва кімнати",
        accessorKey: "name",
        size: 40,
        cell: ({ row, table }) => {
            const isDialog = (table.options.meta as any)?.isDialog
            if (isDialog) {
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{row.original.name}</span>
                        <a
                            href={`/rooms/${row.original.roomId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                            data-no-select="true"
                            title="Відкрити сторінку кімнати в новій вкладці"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )
            }
            return (
                <Link to={`/rooms/${row.original.roomId}`} className="font-semibold hover:underline">
                    {row.original.name}
                </Link>
            )
        },
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
