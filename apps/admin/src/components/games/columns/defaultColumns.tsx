import type { CustomColumnDef } from "@/types/table"
import type { Game } from "@/components/games/types/game"
import { PuzzleIcon } from "lucide-react"
import { Link } from "react-router-dom"

export const defaultColumns: CustomColumnDef<Game>[] = [
    {
        id: "name",
        header: "Назва гри",
        accessorKey: "name",
        size: 20,
        cell: ({ row }) => (
            <div className="font-semibold">{row.original.name}</div>
        ),
    },{
        id: "systems",
        header: "Системи",
        accessorKey: "systems",
        size: 30,
        cell: ({ row }) => {
            const systems = row.original.systems || []
            if (systems.length === 0)
                return <span className="text-muted-foreground italic">—</span>

            return (
                <div className="flex items-center gap-2">
                    <PuzzleIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-x-1">
                        {systems.map((s, i) => (
                            <span key={s.systemId} className="inline-flex items-center gap-1">
                        <Link
                            to={`/systems/${s.systemId}`}
                            className="text-primary hover:underline"
                        >
                {s.name}
                </Link>
                                {i < systems.length - 1 && ","}
            </span>
                        ))}
                    </div>
                </div>
            )
        },
    },
    {
        id: "description",
        header: "Опис",
        accessorKey: "description",
        size: 45,
        cell: ({ row }) => (
            <div className="text-muted-foreground line-clamp-2">
                {row.original.description || "—"}
                </div>
        ),
    }
]
