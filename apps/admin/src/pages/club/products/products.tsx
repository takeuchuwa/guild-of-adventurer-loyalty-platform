"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ProductTable } from "@/components/products/products-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Product } from "@/components/products/types/product.tsx"
import { productsColumns } from "@/components/products/columns/products-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useRef } from "react"

export default function ProductsPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук за назвою...",
    }

    const navigate = useNavigate()

    // Handlers for table actions
    const handleCreateProduct = () => {
        console.log("Create new product")
        navigate("/products/create")
    }

    const handleEditProduct = (selected: Product[]) => {
        const product = selected[0]
        if (product) {
            console.log("Edit product:", product)
            navigate(`/products/${product.productId}`)
        }
    }

    const handleDeleteProduct = (selected: Product[]) => {
        const product = selected[0]
        if (product) {
            console.log("Delete product:", product)
            // TODO: trigger delete confirmation or API call
        }
    }

    const loadProductsRef = useRef<(() => Promise<void>) | null>(null)

    return (
        <Layout breadcrumbs={[{ label: "Товари", path: "/products" }]}>
            <div className="container mx-auto py-10">
                <ProductTable
                    columns={productsColumns}
                    searchProperties={searchProperties}
                    title="Товари"
                    onLoadProductsRef={loadProductsRef}
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
        </Layout>
    )
}
