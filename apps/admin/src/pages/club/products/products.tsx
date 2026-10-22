"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ProductTable } from "@/components/products/products-table.tsx"
import { Pencil, PlusCircle, Trash2, Sliders } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Product } from "@/components/products/types/product.tsx"
import { productsColumns } from "@/components/products/columns/products-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useRef, useState, useMemo, useCallback } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { BulkUpdateDialog } from "@/components/shared/dialogs/bulk-update-dialog"
import { deleteProduct, bulkUpdateProducts } from "@/components/products/api/products-api.ts"
import { toast } from "sonner"
import { CategoryFilter } from "@/components/shared/filters/category-filter"
import { NumericFilter } from "@/components/shared/filters/numeric-filter"

export default function ProductsPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук за назвою...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [productsToDelete, setProductsToDelete] = useState<Product[]>([])
    const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
    const [tableKey, setTableKey] = useState(0)
    const loadProductsRef = useRef<(() => Promise<void>) | null>(null)

    // Filter states
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
    const [priceVal, setPriceVal] = useState<number | undefined>(undefined)
    const [priceOp, setPriceOp] = useState<string | undefined>(undefined)
    const [pointsVal, setPointsVal] = useState<number | undefined>(undefined)
    const [pointsOp, setPointsOp] = useState<string | undefined>(undefined)

    const filterParams = useMemo(() => {
        const params: Record<string, any> = {}
        if (categoryId) params.categoryId = categoryId
        if (priceVal !== undefined && priceOp) {
            params.priceVal = priceVal
            params.priceOp = priceOp
        }
        if (pointsVal !== undefined && pointsOp) {
            params.pointsVal = pointsVal
            params.pointsOp = pointsOp
        }
        return params
    }, [categoryId, priceVal, priceOp, pointsVal, pointsOp])

    const filters = useMemo(
        () => [
            {
                component: (
                    <CategoryFilter
                        kind="PRODUCT"
                        selectedCategoryId={categoryId}
                        onChange={setCategoryId}
                    />
                ),
            },
            {
                component: (
                    <NumericFilter
                        label="Ціна"
                        value={priceVal}
                        operator={priceOp}
                        onChange={(val, op) => {
                            setPriceVal(val)
                            setPriceOp(op)
                        }}
                        defaultOperator="lte"
                        suffix="₴"
                    />
                ),
            },
            {
                component: (
                    <NumericFilter
                        label="Бали досвіду (XP)"
                        value={pointsVal}
                        operator={pointsOp}
                        onChange={(val, op) => {
                            setPointsVal(val)
                            setPointsOp(op)
                        }}
                        defaultOperator="gte"
                        suffix="XP"
                    />
                ),
            },
        ],
        [categoryId, priceVal, priceOp, pointsVal, pointsOp]
    )

    // Handlers for table actions
    const handleCreateProduct = () => {
        navigate("/products/create")
    }

    const handleEditProduct = (selected: Product[]) => {
        const product = selected[0]
        if (product) {
            navigate(`/products/${product.productId}`)
        }
    }

    const handleDeleteProduct = (selected: Product[]) => {
        if (selected.length > 0) {
            setProductsToDelete(selected)
            setDeleteDialogOpen(true)
        }
    }

    const handleBulkUpdate = () => {
        if (selectedProducts.length >= 2) {
            setBulkUpdateDialogOpen(true)
        }
    }

    const handleConfirmBulkUpdate = async (data: { price?: number; overridePoints?: number | null }) => {
        try {
            const ids = selectedProducts.map((p) => p.productId)
            await bulkUpdateProducts({ ids, ...data })
            toast.success("Товари успішно оновлено")
            // Reset selection by updating tableKey
            setTableKey((prev) => prev + 1)
            setSelectedProducts([])
        } catch (error: any) {
            console.error("Error updating products in bulk:", error)
            toast.error(error.message || "Помилка при груповому оновленні")
        }
    }

    const handleSelectionChange = useCallback((selectedMap: Map<string, Product>) => {
        setSelectedProducts(Array.from(selectedMap.values()))
    }, [])


    const confirmDelete = async () => {
        if (productsToDelete.length === 0) return

        try {
            const ids = productsToDelete.map((p) => p.productId).join(",")
            await deleteProduct(ids)
            toast.success(productsToDelete.length > 1 ? "Товари успішно видалено" : "Товар успішно видалено")
            // Reset selection by updating tableKey
            setTableKey((prev) => prev + 1)
            setSelectedProducts([])
        } catch (error: any) {
            console.error("Error deleting product:", error)
            toast.error(error.message || "Помилка при видаленні товару")
        } finally {
            setProductsToDelete([])
            setDeleteDialogOpen(false)
        }
    }

    const tableActions = useMemo(() => {
        const selectedCount = selectedProducts.length
        return [
            {
                label: "Додати",
                icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                onClick: handleCreateProduct,
                variant: selectedCount === 0 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Редагувати",
                icon: <Pencil className="mr-0.5 h-4 w-4" />,
                onClick: handleEditProduct,
                isDisabled: (selected: Product[]) => selected.length !== 1,
                variant: selectedCount === 1 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Групове оновлення",
                icon: <Sliders className="mr-0.5 h-4 w-4" />,
                onClick: handleBulkUpdate,
                isDisabled: (selected: Product[]) => selected.length < 2,
                variant: selectedCount >= 2 ? ("default" as const) : ("outline" as const),
            },
            {
                label: "Видалити",
                icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                onClick: handleDeleteProduct,
                isDisabled: (selected: Product[]) => selected.length < 1,
                variant: "destructiveOutline" as const,
            },
        ]
    }, [selectedProducts])

    return (
        <Layout breadcrumbs={[{ label: "Товари", path: "/products" }]}>
            <div className="p-7">
                <ProductTable
                    key={tableKey}
                    columns={productsColumns}
                    searchProperties={searchProperties}
                    title="Товари"
                    onLoadProductsRef={loadProductsRef}
                    storageKey="products"
                    filters={filters}
                    filterParams={filterParams}
                    onSelectionChange={handleSelectionChange}
                    actions={tableActions}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title={productsToDelete.length > 1 ? "Видалити товари" : "Видалити товар"}
                description={productsToDelete.length > 1 ? "Ця дія незворотна. Обрані товари будуть видалені назавжди." : "Ця дія незворотна. Товар буде видалено назавжди."}
                itemName={productsToDelete.length === 1 ? productsToDelete[0]?.name : undefined}
                itemCount={productsToDelete.length}
            />

            <BulkUpdateDialog
                open={bulkUpdateDialogOpen}
                onOpenChange={setBulkUpdateDialogOpen}
                onConfirm={handleConfirmBulkUpdate}
                title="Масове оновлення товарів"
                description={`Виберіть показники, які хочете оновити для обраних товарів (${selectedProducts.length} шт.).`}
                count={selectedProducts.length}
            />
        </Layout>
    )
}

