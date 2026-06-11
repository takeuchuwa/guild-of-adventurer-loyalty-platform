"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ProductTable } from "@/components/products/products-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Product } from "@/components/products/types/product.tsx"
import { productsColumns } from "@/components/products/columns/products-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useRef, useState, useMemo } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteProduct } from "@/components/products/api/products-api.ts"
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
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
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
        const product = selected[0]
        if (product) {
            setProductToDelete(product)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!productToDelete) return

        try {
            await deleteProduct(productToDelete.productId)
            toast.success("Товар успішно видалено")
            if (loadProductsRef.current) {
                await loadProductsRef.current()
            }
        } catch (error: any) {
            console.error("Error deleting product:", error)
            toast.error(error.message || "Помилка при видаленні товару")
        } finally {
            setProductToDelete(null)
            setDeleteDialogOpen(false)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Товари", path: "/products" }]}>
            <div className="container mx-auto py-10">
                <ProductTable
                    columns={productsColumns}
                    searchProperties={searchProperties}
                    title="Товари"
                    onLoadProductsRef={loadProductsRef}
                    storageKey="products"
                    filters={filters}
                    filterParams={filterParams}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateProduct,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditProduct,
                            isDisabled: (selected: Product[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteProduct,
                            isDisabled: (selected: Product[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити товар"
                description="Ця дія незворотна. Товар буде видалено назавжди."
                itemName={productToDelete?.name}
            />
        </Layout>
    )
}
