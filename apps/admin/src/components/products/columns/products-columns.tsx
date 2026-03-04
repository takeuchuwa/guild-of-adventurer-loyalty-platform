import type {CustomColumnDef} from "@/types/table"
import type {Product} from "@/components/products/types/product"
import {categoryKindMap} from "@/components/categories/columns/category-columns.tsx";
import {PackageIcon} from "lucide-react";
import type {Category} from "@/components/categories/types/category-types.tsx";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";

export const productsColumns: CustomColumnDef<Product>[] = [
    {
        id: "name",
        header: "Назва",
        accessorKey: "name",
        cell: ({row}) => {
            return (
                <div className="font-semibold">{row.original.name}</div>
            )
        },
        size: 20,
    },
    {
        id: "price",
        header: "Ціна",
        accessorKey: "price",
        size: 10,
        minSize: 10,
        cell: ({row}) => {
            const price = row.original.price ?? 0
            const formatted = price.toLocaleString("uk-UA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })

            return (
                <Button
                    variant="default"
                    className="pointer-events-none font-semibold w-22 h-6"
                    size="sm"
                >
                    {formatted} ₴
                </Button>
            )
        },
    },
    {
        id: "sku",
        header: "SKU",
        accessorKey: "sku",
        size: 15,
        minSize: 15
    },
    {
        id: "overridePoints",
        header: "Бали досвіду",
        accessorKey: "overridePoints",
        size: 10,
        minSize: 10,
        cell: ({row}) => {
            const overridePoints = row.original.overridePoints
            const price = row.original.price
            const fallback = Math.floor(price * 0.10)

            if (overridePoints !== null && overridePoints !== undefined) {
                return <Button
                    variant="default"
                    className="pointer-events-none font-semibold w-8 h-6"
                    size="sm"
                >
                    {overridePoints}
                </Button>
            }

            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="pointer-events-none font-semibold w-8 h-6 text-muted-foreground justify-center"
                    >
                        {fallback}
                    </Button>
                    <span className="text-muted-foreground text-sm">(10% ціни)</span>
                </div>
            )
        },
    },

    {
        id: "categories",
        header: "Категорії",
        accessorKey: "categories",
        size: 30,
        cell: ({row}) => {
            const categories = row.original.categories as Category[] | undefined
            if (!categories || categories.length === 0)
                return <span className="text-muted-foreground italic">—</span>

            const firstKind = categories[0].kind as keyof typeof categoryKindMap
            const kindData = categoryKindMap[firstKind]

            return (
                <div className="flex items-center gap-2">
                    {kindData?.icon ?? <PackageIcon className="w-4 h-4 text-muted-foreground"/>}
                    <div className="flex flex-wrap gap-x-1">
                        {categories.map((c, i) => (
                            <span key={c.categoryId} className="inline-flex items-center gap-1">
                <Link
                    to={`/categories/${c.categoryId}`}
                    className="hover:underline"
                >
                  {c.name}
                </Link>
                                {i < categories.length - 1 && ","}
              </span>
                        ))}
                    </div>
                </div>
            )
        },
    }
]
