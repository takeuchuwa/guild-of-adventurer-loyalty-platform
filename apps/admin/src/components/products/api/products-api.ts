import type { SortingState } from "@tanstack/react-table"
import type { Product } from "@/components/products/types/product.tsx"

import { axiosInstance } from "@/lib/api-utils.ts"
import { AxiosError } from "axios"

export interface CursorParams {
    pageSize: number
    cursor?: string | null
    includeCount?: boolean
}

export interface FetchProductsOptions {
    pagination: CursorParams
    sorting: SortingState
    currentSearch?: string
}

export interface ApiPagination {
    pageSize: number
    nextCursor: string | null
    hasNextPage: boolean
    total?: number
}

export interface FetchProductsResponse {
    products: Product[]
    pagination: ApiPagination
}

export interface CreateProductRequest {
    name: string
    sku: string
    price: number
    overridePoints?: number | null
}

export interface UpdateProductRequest {
    name: string
    sku: string
    price: number
    overridePoints?: number | null
}

export async function fetchProducts({
    pagination,
    sorting,
    currentSearch,
}: FetchProductsOptions): Promise<FetchProductsResponse> {
    try {
        const response = await axiosInstance.get("/products", {
            params: {
                pageSize: pagination.pageSize,
                cursor: pagination.cursor,
                includeCount: pagination.includeCount,
                sort: sorting.length && sorting[0]?.id ? sorting.map((s) => `${s.id},${s.desc ? "desc" : "asc"}`).join(",") : undefined,
                ...(currentSearch && { q: currentSearch }),
            },
        })

        if (!response.data.ok) {
            throw new Error("Server returned ok=false")
        }

        return {
            products: response.data.data || [],
            pagination: response.data.pagination || {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    } catch (error) {
        console.error("Error fetching products:", error)
        return {
            products: [],
            pagination: {
                pageSize: pagination.pageSize,
                hasNextPage: false,
                nextCursor: null,
            },
        }
    }
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
    try {
        const response = await axiosInstance.post("/products", data)

        console.log("[v0] Create product response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to create product")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
            throw new Error("Продукт з таким SKU вже існує")
        }
        console.error("Error creating product:", error)
        throw error
    }
}

export async function updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
    try {
        const response = await axiosInstance.put(`/products/${productId}`, data)

        console.log("[v0] Update product response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to update product")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 409) {
            throw new Error("Продукт з таким SKU вже існує")
        }
        console.error("Error updating product:", error)
        throw error
    }
}

export async function getProductById(productId: string): Promise<Product> {
    try {
        const response = await axiosInstance.get(`/products/${productId}`)

        console.log("[v0] Get product response:", response.data)

        if (response.data.ok !== undefined) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Failed to fetch product")
            }
            return response.data.data
        }

        return response.data
    } catch (error) {
        console.error("Error fetching product:", error)
        throw error
    }
}

export async function deleteProduct(productId: string): Promise<void> {
    try {
        const response = await axiosInstance.delete(`/products/${productId}`)

        // Check for 409 conflict
        if (response.status === 409) {
            throw new Error("Не можна видалити продукт, який використовується")
        }

        // Handle both response formats
        if (response.data && typeof response.data === "object" && "ok" in response.data) {
            if (!response.data.ok) {
                throw new Error(response.data.error || "Помилка при видаленні продукту")
            }
        }
    } catch (error: any) {
        console.error("[v0] Delete product error:", error)

        // Handle axios errors
        if (error instanceof AxiosError) {
            if (error.response?.status === 409) {
                throw new Error("Не можна видалити продукт, який використовується")
            }
            throw new Error(error.response?.data?.error || "Помилка при видаленні продукту")
        }

        throw error
    }
}
