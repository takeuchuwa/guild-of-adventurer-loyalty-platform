import type { CustomColumnDef } from "@/types/table.ts"
import type { PointsLedgerEntry } from "@/components/members/types/points-ledger"
import { isDonationNote } from "@/lib/donation"

export const pointsLedgerColumns: CustomColumnDef<PointsLedgerEntry>[] = [
    {
        id: "occurredAt",
        accessorKey: "occurredAt",
        header: "Дата",
        size: 15,
        cell: ({ row }) => {
            const timestamp = row.original.occurredAt
            const date = new Date(timestamp * 1000)
            return (
                <span className="text-foreground/55 font-mono text-[12.5px]">
                    {date.toLocaleString("uk-UA", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            )
        },
    },
    {
        id: "delta",
        accessorKey: "delta",
        header: "Зміна",
        size: 10,
        cell: ({ row }) => {
            const delta = row.original.delta
            const isPositive = delta > 0
            return (
                <span className={`font-mono text-[14px] font-bold ${isPositive ? "text-accent-bright" : "text-destructive"}`}>
                    {isPositive ? "+" : ""}
                    {delta}
                </span>
            )
        },
    },
    {
        id: "balanceAfter",
        accessorKey: "balanceAfter",
        header: "Баланс після",
        size: 12,
        cell: ({ row }) => {
            return <span className="text-foreground/70 font-mono text-[13px]">{row.original.balanceAfter}</span>
        },
    },
    {
        id: "reason",
        accessorKey: "adminNote",
        header: "Причина",
        size: 38,
        cell: ({ row }) => {
            const { adminNote, activityId, activityName, productId, productName, promoId, promoName } = row.original

            if (isDonationNote(adminNote)) {
                return (
                    <span className="text-muted-foreground">
                        {adminNote}
                        {activityId && <> · {activityName || activityId}</>}
                    </span>
                )
            }

            if (adminNote) {
                return <span className="text-muted-foreground italic">{adminNote}</span>
            }

            if (promoId) {
                return <span className="text-muted-foreground">Промоакція: {promoName || promoId}</span>
            }

            if (activityId) {
                return <span className="text-muted-foreground">Активність: {activityName || activityId}</span>
            }

            if (productId) {
                return <span className="text-muted-foreground">Продукт: {productName || productId}</span>
            }

            return <span className="text-muted-foreground">—</span>
        },
    },
    {
        id: "type",
        accessorKey: "adminNote",
        header: "Тип",
        size: 15,
        cell: ({ row }) => {
            const { adminNote, activityId, productId, promoId } = row.original

            // One mono hairline tag for every kind — the kind is carried by the word, not by colour.
            const label = isDonationNote(adminNote)
                ? "Донат"
                : adminNote
                    ? "Адмін"
                    : promoId
                        ? "Промо"
                        : activityId
                            ? "Активність"
                            : productId
                                ? "Продукт"
                                : "Інше"

            return (
                <span className="text-foreground/60 font-heading border border-[rgba(237,230,216,.18)] px-2 py-[3.5px] text-[11px] font-semibold uppercase tracking-[.1em] whitespace-nowrap">
                    {label}
                </span>
            )
        },
    },
]
