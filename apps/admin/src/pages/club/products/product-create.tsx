import { Layout } from "@/components/layout/layout"
import { ProductForm } from "@/components/products/product-form"
import type { ProductFormData } from "@/components/products/types/validations/product-validation"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState, useMemo } from "react"
import { createProduct } from "@/components/products/api/products-api"
import { toast } from "sonner"
import type { Product } from "@/components/products/types/product"

export default function ProductCreatePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)

    const initialName = searchParams.get("name") || ""
    const returnTo = searchParams.get("returnTo")

    const initialData = useMemo(() => {
        if (!initialName) return undefined
        return {
            name: initialName,
            sku: "",
            price: 0,
            overridePoints: undefined,
            categoryIds: [],
        } as unknown as Product
    }, [initialName])

    const handleSubmit = async (data: ProductFormData, isCreateAndAdd?: boolean) => {
        setIsLoading(true)
        try {
            const created = await createProduct({
                name: data.name,
                price: data.price,
                sku: data.sku || undefined,
                overridePoints: data.overridePoints === null ? undefined : data.overridePoints,
                categoryIds: data.categoryIds,
            })
            toast.success("Продукт успішно створено")

            if (isCreateAndAdd) {
                navigate("/checkout", { state: { addItem: { id: created.productId, type: "product" } } })
            } else {
                navigate("/products")
            }
        } catch (error) {
            console.error("Error creating product:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при створенні продукту"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        if (returnTo === "checkout") {
            navigate("/checkout")
        } else {
            navigate("/products")
        }
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Продукти", path: "/products" },
                { label: "Створити продукт", path: "/products/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Створити продукт</h1>
                    <p className="text-muted-foreground mt-2">Заповніть форму для створення нового продукту</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <ProductForm
                        mode="create"
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                        initialData={initialData}
                        showCreateAndAdd={returnTo === "checkout"}
                    />
                </div>
            </div>
        </Layout>
    )
}
