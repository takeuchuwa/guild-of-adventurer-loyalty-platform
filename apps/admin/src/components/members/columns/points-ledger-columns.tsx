import type { CustomColumnDef } from "@/types/table.ts"
import type { PointsLedgerEntry } from "@/components/members/types/points-ledger"

export const pointsLedgerColumns: CustomColumnDef<PointsLedgerEntry>[] = [
    {
        id: "occurredAt",
        accessorKey: "occurredAt",
        header: "Дата",
        size: 15,
        cell: ({ row }) => {
            const timestamp = row.original.occurredAt
            const date = new Date(timestamp * 1000)
            return date.toLocaleString("uk-UA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
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
                <span className={isPositive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
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
            return <span className="font-medium">{row.original.balanceAfter}</span>
        },
    },
    {
        id: "reason",
        accessorKey: "adminNote",
        header: "Причина",
        size: 40,
        cell: ({ row }) => {
            const { adminNote, activityId, activityName, productId, productName, promoId, promoName } = row.original

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

            if (adminNote) {
                return <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Адмін</span>
            }

            if (promoId) {
                return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Промо</span>
            }

            if (activityId) {
                return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Активність</span>
            }

            if (productId) {
                return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Продукт</span>
            }

            return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Інше</span>
        },
    },
]
