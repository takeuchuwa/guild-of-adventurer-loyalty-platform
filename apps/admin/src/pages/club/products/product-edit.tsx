import { Layout } from "@/components/layout/layout"
import { ProductForm } from "@/components/products/product-form"
import type { ProductFormData } from "@/components/products/types/validations/product-validation"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { getProductById, updateProduct } from "@/components/products/api/products-api"
import { toast } from "sonner"
import type { Product } from "@/components/products/types/product"
import { Loader2 } from "lucide-react"

export default function ProductEditPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [product, setProduct] = useState<Product | null>(null)

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                toast.error("ID товару не знайдено")
                navigate("/products")
                return
            }

            setIsFetching(true)
            try {
                const data = await getProductById(id)
                setProduct(data)
            } catch (error) {
                console.error("Error fetching product:", error)
                toast.error("Помилка при завантаженні товару")
                navigate("/products")
            } finally {
                setIsFetching(false)
            }
        }

        fetchProduct()
    }, [id, navigate])

    const handleSubmit = async (data: ProductFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateProduct(id, data)
            toast.success("Товар успішно оновлено")
            navigate("/products")
        } catch (error) {
            console.error("Error updating product:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при оновленні товару"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/products")
    }

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Товари", path: "/products" },
                    { label: "Редагувати товар", path: `/products/${id}` },
                ]}
            >
                <div className="container mx-auto py-10 max-w-2xl">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </div>
            </Layout>
        )
    }

    if (!product) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Товари", path: "/products" },
                { label: "Редагувати товар", path: `/products/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Редагувати товар</h1>
                    <p className="text-muted-foreground mt-2">Оновіть інформацію про товар</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <ProductForm
                        mode="edit"
                        initialData={product}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </Layout>
    )
}
