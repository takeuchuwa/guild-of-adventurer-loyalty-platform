import { Layout } from "@/components/layout/layout"
import { CategoryForm } from "@/components/categories/category-form"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { createCategory } from "@/components/categories/api/category-api.ts"
import { toast } from "sonner"
import type {CategoryFormData} from "@/components/categories/types/validations/category-validation.ts";

export default function CategoryCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: CategoryFormData) => {
        setIsLoading(true)
        try {
            await createCategory(data)
            toast.success("Категорію успішно створено")
            navigate("/categories")
        } catch (error) {
            console.error("Error creating category:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при створенні категорії"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        navigate("/categories")
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Категорії", path: "/categories" },
                { label: "Створити категорію", path: "/categories/create" },
            ]}
        >
            <div className="container mx-auto py-10 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Створити категорію</h1>
                    <p className="text-muted-foreground mt-2">Заповніть форму для створення нової категорії</p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <CategoryForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
                </div>
            </div>
        </Layout>
    )
}
