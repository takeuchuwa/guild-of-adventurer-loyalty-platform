"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { CategoryTable } from "@/components/categories/categories-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Category } from "@/components/categories/types/category-types.tsx"
import { categoryColumns } from "@/components/categories/columns/category-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useRef, useState } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteCategory } from "@/components/categories/api/category-api.ts"
import { toast } from "sonner"

export default function CategoriesPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук за назвою...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const reloadCategoriesRef = useRef<(() => Promise<void>) | null>(null)

    // Handlers for table actions
    const handleCreateCategory = () => {
        console.log("Create new category")
        navigate("/categories/create")
    }

    const handleEditCategory = (selected: Category[]) => {
        const category = selected[0]
        if (category) {
            console.log("Edit category:", category)
            navigate(`/categories/${category.categoryId}`)
        }
    }

    const handleDeleteCategory = (selected: Category[]) => {
        const category = selected[0]
        if (category) {
            setCategoryToDelete(category)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!categoryToDelete) return

        try {
            await deleteCategory(categoryToDelete.categoryId)
            toast.success("Категорію успішно видалено")
            if (reloadCategoriesRef.current) {
                await reloadCategoriesRef.current()
            }
        } catch (error: any) {
            console.error("Error deleting category:", error)
            toast.error(error.message || "Помилка при видаленні категорії")
        } finally {
            setCategoryToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Категорії", path: "/categories" }]}>
            <div className="container mx-auto py-10">
                <CategoryTable
                    columns={categoryColumns}
                    searchProperties={searchProperties}
                    title="Категорії"
                    onLoadCategoriesRef={reloadCategoriesRef}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreateCategory,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditCategory,
                            isDisabled: (selected: Category[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeleteCategory,
                            isDisabled: (selected: Category[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити категорію"
                description="Ця дія незворотна. Категорія буде видалена назавжди."
                itemName={categoryToDelete?.name}
            />
        </Layout>
    )
}
