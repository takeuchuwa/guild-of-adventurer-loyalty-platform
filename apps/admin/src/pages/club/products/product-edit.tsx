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
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
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
            <ProductForm
                mode="edit"
                initialData={product}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
            />
        </Layout>
    )
}
