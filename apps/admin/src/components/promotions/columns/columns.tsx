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
        id: "effect",
        header: "Ефект",
        size: 20,
        cell: ({ row }) => {
            const effects = row.original.config?.effects
            if (!effects) return <span className="text-muted-foreground text-sm">—</span>

            const parts: string[] = []

            if (effects.price) {
                if (effects.price.type === "percentage") parts.push(`-${effects.price.value}%`)
                else if (effects.price.type === "fixed") parts.push(`-${effects.price.value}₴`)
                else if (effects.price.type === "override") parts.push(`${effects.price.value}₴`)
            }

            if (effects.points) {
                if (effects.points.type === "multiplier") parts.push(`×${effects.points.value} балів`)
                else if (effects.points.type === "bonus") parts.push(`+${effects.points.value} балів`)
            }

            if (parts.length === 0) return <span className="text-muted-foreground text-sm">—</span>

            return (
                <div className="flex flex-wrap gap-1">
                    {parts.map((part, i) => (
                        <Badge
                            key={i}
                            variant="secondary"
                            // Generated rule fragments — sentence case, body face.
                            className="border-[rgba(201,158,58,.35)] bg-[rgba(201,158,58,.07)] font-sans text-[11.5px] font-medium tracking-normal normal-case text-primary"
                        >
                            {part}
                        </Badge>
                    ))}
                </div>
            )
        },
    },
    {
        id: "usage",
        header: "Використання",
        size: 15,
        cell: ({ row }) => {
            const rem = row.original.usageRemaining
            return (
                <div className="text-sm">
                    {rem === null ? (
                        <span className="text-xl leading-none" title="Необмежено">∞</span>
                    ) : (
                        <span>Залишилось: {rem}</span>
                    )}
                </div>
            )
        },
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
