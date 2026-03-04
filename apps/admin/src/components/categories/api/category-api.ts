import type { SortingState } from "@tanstack/react-table"
import type { Category } from "@/components/categories/types/category-types.tsx"

import { axiosInstance } from "@/lib/api-utils.ts"
import { AxiosError } from "axios"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchCategoriesOptions {
    pagination: CursorParams
    sorting: SortingState
    currentSearch?: string
    kind?: "PRODUCT" | "ACTIVITY"
}

export interface ApiPagination {
    pageSize: number
    nextCursor: string | null
    hasNextPage: boolean
    total?: number
}

export interface FetchCategoriesResponse {
    categories: Category[]
    pagination: ApiPagination
}

export interface CreateCategoryRequest {
    name: string
    kind: "PRODUCT" | "ACTIVITY"
}

export interface UpdateCategoryRequest {
    name: string
    kind: "PRODUCT" | "ACTIVITY"
}

export async function fetchCategories({
    pagination,
    sorting,
    currentSearch,
    kind,
}: FetchCategoriesOptions): Promise<FetchCategoriesResponse> {
    try {
        const response = await axiosInstance.get("/categories", {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
                ...(currentSearch && { q: currentSearch }),
                ...(kind && { kind }),
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            categories: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching categories:", error)
        return {
            categories: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function fetchCategoriesByKind(kind: "PRODUCT" | "ACTIVITY"): Promise<FetchCategoriesResponse> {
    try {
        const response = await axiosInstance.get("/categories", {
            params: {
                pageSize: 100,
                kind,
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            categories: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: 100,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching categories by kind:", error)
        return {
            categories: [],
            pagination: {
                pageSize: 100,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
        const response = await axiosInstance.post("/categories", data)

        console.log("[v0] Create category response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to create category")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
            throw new Error("Категорія з такою назвою вже існує")
        }
        console.error("Error creating category:", error)
        throw error
    }
}

export async function updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<Category> {
    try {
        const response = await axiosInstance.put(`/categories/${categoryId}`, data)

        console.log("[v0] Update category response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to update category")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
            throw new Error("Категорія з такою назвою вже існує")
        }
        console.error("Error updating category:", error)
        throw error
    }
}

export async function getCategoryById(categoryId: string): Promise<Category> {
    try {
        const response = await axiosInstance.get(`/categories/${categoryId}`)

        console.log("[v0] Get category response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to fetch category")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        console.error("Error fetching category:", error)
        throw error
    }
}

export async function deleteCategory(categoryId: string): Promise<void> {
    try {
        const response = await axiosInstance.delete(`/categories/${categoryId}`)

        // Check for 409 conflict
        if (response.status === 409) {
            throw new Error("Не можна видалити категорію, яка використовується")
        }

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при видаленні категорії")
            }
        }
    } catch (error: any) {
        console.error("[v0] Delete category error:", error)

        // Handle axios errors
        if (error instanceof AxiosError) {
            if (error.response?.status === 409) {
                throw new Error("Не можна видалити категорію, яка використовується")
            }
            throw new Error(error.response?.data?.error || "Помилка при видаленні категорії")
        }

        throw error
    }
}
