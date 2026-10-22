import type {CustomColumnDef} from "@/types/table"
import type {Category} from "@/components/categories/types/category-types.tsx"
import {Calendar1Icon, ScanBarcodeIcon, ExternalLink} from "lucide-react"
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
        cell: ({row, table}) => {
            const isDialog = (table.options.meta as any)?.isDialog
            if (isDialog) {
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{row.original.name}</span>
                        <a
                            href={`/categories/${row.original.categoryId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                            data-no-select="true"
                            title="Відкрити сторінку категорії в новій вкладці"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )
            }
            return (
                <Link to={`/categories/${row.original.categoryId}`} className="font-semibold hover:underline">
                    {row.original.name}
                </Link>
            )
        },
        size: 25,
    },
    {
        id: "kind",
        header: "Тип категорії",
        accessorKey: "kind",
        size: 75,
        cell: ({row, table}) => {
            const kind = row.original.kind as keyof typeof categoryKindMap
            const data = categoryKindMap[kind]
            if (!data) return null
            const isDialog = (table.options.meta as any)?.isDialog
            return (
                <div className="flex items-center gap-2">
                    {data.icon}
                    {isDialog ? (
                        <span className="font-semibold text-foreground">{data.label}</span>
                    ) : (
                        <Link to={`${data.link}`} className="text-primary hover:underline">{data.label}</Link>
                    )}
                </div>
            )
        },
    },
]
