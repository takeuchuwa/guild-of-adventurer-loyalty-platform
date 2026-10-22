import { cn } from "@/lib/utils"

export type CheckoutItemType = "product" | "activity"

/**
 * The flat shape both the browse grid and the "recently used" strip render.
 * Products and activities are different entities server-side but identical at
 * the till: a name, a price, and one line of context.
 */
export interface GridItem {
    id: string
    type: CheckoutItemType
    name: string
    price: number
    /** Products only. -1 means the item is not counted. */
    inventory?: number
    /** Activities only — the session start, as a unix timestamp. */
    startDate?: number
}

function MetaLine({ item }: { item: GridItem }) {
    if (item.type === "activity") {
        if (!item.startDate) return null
        return <>{new Date(item.startDate * 1000).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" })}</>
    }

    if (item.inventory === undefined || item.inventory === -1) return <>Без ліміту</>

    return (
        <>
            <span className="font-mono">{item.inventory}</span> шт
        </>
    )
}

function ItemTile({ item, onPick }: { item: GridItem; onPick: (item: GridItem) => void }) {
    const isOut = item.type === "product" && item.inventory === 0

    return (
        <button
            type="button"
            onClick={() => onPick(item)}
            className="bg-surface flex h-[104px] cursor-pointer flex-col justify-between p-3.5 text-left transition-colors hover:bg-[rgba(201,158,58,.06)]"
            title={item.name}
        >
            <div className="line-clamp-2 text-[13.5px] leading-[1.3] font-semibold">{item.name}</div>
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-accent-bright font-mono text-[16px] font-bold">{item.price} ₴</span>
                <span
                    className={cn(
                        "font-heading text-[10.5px] font-medium tracking-[.1em] uppercase",
                        isOut ? "text-destructive" : "text-foreground/45",
                    )}
                >
                    <MetaLine item={item} />
                </span>
            </div>
        </button>
    )
}

/**
 * Hairline-gapped tile grid. `dense` is the recently-used strip, which packs
 * more columns because its tiles are the ones the cashier hits most.
 */
export function ItemGrid({
    items,
    onPick,
    dense = false,
    className,
}: {
    items: GridItem[]
    onPick: (item: GridItem) => void
    dense?: boolean
    className?: string
}) {
    return (
        <div
            className={cn(
                "grid gap-px bg-[rgba(201,158,58,.16)]",
                dense
                    ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6"
                    : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
                className,
            )}
        >
            {items.map((item) => (
                <ItemTile key={`${item.type}:${item.id}`} item={item} onPick={onPick} />
            ))}
        </div>
    )
}
