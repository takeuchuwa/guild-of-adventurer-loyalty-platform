import type {ColumnDef} from "@tanstack/react-table"

export type CustomColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
    searchable?: boolean
    complexSearchInputType?: "text" | "select"
    options?: string[]
}
