import { Layout } from "@/components/layout/layout"
import { CategoryForm } from "@/components/categories/category-form"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { getCategoryById, updateCategory } from "@/components/categories/api/category-api.ts"
import { toast } from "sonner"
import type { Category } from "@/components/categories/types/category-types.tsx"
import { Loader2 } from "lucide-react"
import type {CategoryFormData} from "@/components/categories/types/validations/category-validation.ts";

export default function CategoryEditPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [category, setCategory] = useState<Category | null>(null)

    useEffect(() => {
        const fetchCategory = async () => {
            if (!id) {
                toast.error("ID категорії не знайдено")
                navigate("/categories")
                return
            }

            setIsFetching(true)
            try {
                const data = await getCategoryById(id)
                setCategory(data)
            } catch (error) {
                console.error("Error fetching category:", error)
                toast.error("Помилка при завантаженні категорії")
                navigate("/categories")
            } finally {
                setIsFetching(false)
            }
        }

        fetchCategory()
    }, [id, navigate])

    const handleSubmit = async (data: CategoryFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateCategory(id, data)
            toast.success("Категорію успішно оновлено")
            navigate("/categories")
        } catch (error) {
            console.error("Error updating category:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при оновленні категорії"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/categories")
    }

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Категорії", path: "/categories" },
                    { label: "Редагувати категорію", path: `/categories/${id}` },
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

    if (!category) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Категорії", path: "/categories" },
                { label: "Редагувати категорію", path: `/categories/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Редагувати категорію</h1>
                    <p className="text-muted-foreground mt-2">Оновіть інформацію про категорію</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <CategoryForm
                        mode="edit"
                        initialData={category}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </Layout>
    )
}
