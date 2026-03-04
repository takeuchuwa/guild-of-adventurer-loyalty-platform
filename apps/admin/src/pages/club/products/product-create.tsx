import { Layout } from "@/components/layout/layout"
import { ProductForm } from "@/components/products/product-form"
import type { ProductFormData } from "@/components/products/types/validations/product-validation"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { createProduct } from "@/components/products/api/products-api"
import { toast } from "sonner"

export default function ProductCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: ProductFormData) => {
        setIsLoading(true)
        try {
            await createProduct(data)
            toast.success("Продукт успішно створено")
            navigate("/products")
        } catch (error) {
            console.error("Error creating product:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при створенні продукту"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/products")
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
                    <ProductForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
                </div>
            </div>
        </Layout>
    )
}
