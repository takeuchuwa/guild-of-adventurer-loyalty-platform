import type { CustomColumnDef } from "@/types/table"
import type { Game } from "@/components/games/types/game"
import { PuzzleIcon, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

export const defaultColumns: CustomColumnDef<Game>[] = [
    {
        id: "name",
        header: "Назва ігрової системи",
        accessorKey: "name",
        size: 20,
        cell: ({ row, table }) => {
            const isDialog = (table.options.meta as any)?.isDialog
            if (isDialog) {
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{row.original.name}</span>
                        <a
                            href={`/games/${row.original.gameId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                            data-no-select="true"
                            title="Відкрити сторінку гри в новій вкладці"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )
            }
            return (
                <Link to={`/games/${row.original.gameId}`} className="font-semibold hover:underline">
                    {row.original.name}
                </Link>
            )
        },
    },{
        id: "systems",
        header: "Варіанти правил",
        accessorKey: "systems",
        size: 30,
        cell: ({ row, table }) => {
            const systems = row.original.systems || []
            if (systems.length === 0)
                return <span className="text-muted-foreground italic">—</span>

            const isDialog = (table.options.meta as any)?.isDialog

            return (
                <div className="flex items-center gap-2">
                    <PuzzleIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-x-1">
                        {systems.map((s, i) => (
                            <span key={s.systemId} className="inline-flex items-center gap-1">
                                {isDialog ? (
                                    <span className="font-semibold text-foreground">{s.name}</span>
                                ) : (
                                    <Link
                                        to={`/systems/${s.systemId}`}
                                        className="text-primary hover:underline"
                                    >
                                        {s.name}
                                    </Link>
                                )}
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
        cell: ({ row }) => {
            const desc = row.original.description || ""
            if (!desc) return <span className="text-muted-foreground">—</span>
            const truncated = desc.length > 100 ? desc.substring(0, 100) + "..." : desc
            return (
                <div className="text-muted-foreground line-clamp-2">
                    {truncated}
                </div>
            )
        },
    }
]
