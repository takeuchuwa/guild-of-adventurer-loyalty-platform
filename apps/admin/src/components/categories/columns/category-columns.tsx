import type {CustomColumnDef} from "@/types/table"
import type {Category} from "@/components/categories/types/category-types.tsx"
import {Calendar1Icon, ScanBarcodeIcon} from "lucide-react"
import type {ReactNode} from "react";
import {Link} from "react-router-dom";

export const categoryKindMap: Record<
    NonNullable<Category["kind"]>,
    { label: string; icon: ReactNode, link: string }
> = {
    PRODUCT: {
        label: "Товари",
        icon: <ScanBarcodeIcon className="w-4 h-4 text-muted-foreground"/>,
        link: "/products"
    },
    ACTIVITY: {
        label: "Сесії / Активності",
        icon: <Calendar1Icon className="w-4 h-4 text-muted-foreground"/>,
        link: "/activities"
    }
}

export const categoryColumns: CustomColumnDef<Category>[] = [
    {
        id: "name",
        header: "Назва",
        accessorKey: "name",
        cell: ({row}) => {
            return (
                <div className="font-semibold">{row.original.name}</div>
            )
        },
        size: 25,
    },
    {
        id: "kind",
        header: "Тип категорії",
        accessorKey: "kind",
        size: 75,
        cell: ({row}) => {
            const kind = row.original.kind as keyof typeof categoryKindMap
            const data = categoryKindMap[kind]
            if (!data) return null
            return (
                <div className="flex items-center gap-2">
                    {data.icon}
                    <Link to={`${data.link}`} className="text-primary hover:underline">{data.label}</Link>
                </div>
            )
        },
    },
]
