"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DataTable, type DataTableAction, type DataTableFilter } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Product } from "@/components/products/types/product.tsx"
import { fetchProducts } from "@/components/products/api/products-api.ts"

interface ProductsTableProps {
    columns: CustomColumnDef<Product>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Product>[]
    filters?: DataTableFilter[]
    filterParams?: Record<string, any>
    searchProperties?: UseSearchOptions
    onLoadProductsRef?: React.RefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Product>) => void
    initialSelection?: string[]
    pageSize?: number
    storageKey?: string
    meta?: Record<string, any>
}

const EMPTY_FILTER_PARAMS: Record<string, any> = {}

export function ProductTable({
    columns,
    selectionMode = "multiple",
    title,
    emptyStateMessage = "Не знайдено товарів за вашим запитом",
    actions = [],
    filters = [],
    filterParams = EMPTY_FILTER_PARAMS,
    searchProperties,
    onLoadProductsRef,
    onSelectionChange,
    initialSelection,
    pageSize = 10,
    storageKey,
    meta,
}: ProductsTableProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const initialRowSelection = useMemo(() => {
        const selection: RowSelectionState = {}
        initialSelection?.forEach((id) => {
            selection[id] = true
        })
        return selection
    }, [initialSelection])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection)

    const allSelectedProducts = useRef<Map<string, Product>>(new Map())

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination(pageSize, storageKey)
    const { sorting, onSortingChange } = useSorting("", "")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadProducts = useCallback(async () => {
        setIsLoading(true)
        try {
            const { products: fetchedProducts, pagination: page } = await fetchProducts({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
                filterParams,
            })
            setProducts(fetchedProducts)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading products:", error)
            setProducts([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext, filterParams])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    useEffect(() => {
        if (onLoadProductsRef) {
            onLoadProductsRef.current = loadProducts
        }
    }, [loadProducts, onLoadProductsRef])

    const onSelectionChangeRef = useRef(onSelectionChange)
    useEffect(() => {
        onSelectionChangeRef.current = onSelectionChange
    }, [onSelectionChange])

    // Notify parent about selection changes (cross-page tracking)
    useEffect(() => {
        if (products.length > 0) {
            products.forEach((product) => {
                const id = product.productId
                if (rowSelection[id]) {
                    allSelectedProducts.current.set(id, product)
                } else if (allSelectedProducts.current.has(id)) {
                    allSelectedProducts.current.delete(id)
                }
            })

            if (onSelectionChangeRef.current) {
                onSelectionChangeRef.current(new Map(allSelectedProducts.current))
            }
        }
    }, [rowSelection, products])

    useEffect(() => {
        allSelectedProducts.current.clear()
    }, [initialSelection])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={products}
            pagination={{
                pagination,
                onPaginationChange,
                hasNextPage: context.hasNextPage,
                total: context.total,
                onCalculateTotal: triggerCountFetch,
            }}
            sorting={{
                sorting,
                onSortingChange: (updater) => {
                    onSortingChange(updater);
                    resetCursors();
                }
            }}
            rowSelection={{ rowSelection, onRowSelectionChange: setRowSelection }}
            rowCount={context.total ?? -1}
            isLoading={isLoading}
            selectionMode={selectionMode}
            emptyStateMessage={emptyStateMessage}
            actions={actions}
            filters={filters}
            rowId="productId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
            meta={meta}
        />
    )
}
