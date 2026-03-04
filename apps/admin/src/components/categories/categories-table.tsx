"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Category } from "@/components/categories/types/category-types.tsx"
import { fetchCategories } from "@/components/categories/api/category-api.ts"

interface CategoriesTableProps {
    columns: CustomColumnDef<Category>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Category>[]
    searchProperties?: UseSearchOptions
    /** Ref that will receive the reload function */
    onLoadCategoriesRef?: React.MutableRefObject<(() => Promise<void>) | null>
    /** Callback that returns currently selected categories */
    onSelectionChange?: (selected: Map<string, Category>) => void
    kind?: "PRODUCT" | "ACTIVITY"
    initialSelection?: string[]
    pageSize?: number
}

export function CategoryTable({
    columns,
    selectionMode = "single",
    title,
    emptyStateMessage = "Не знайдено учасників за вашим запитом",
    actions = [],
    searchProperties,
    onLoadCategoriesRef,
    onSelectionChange,
    kind,
    initialSelection,
    pageSize = 10,
}: CategoriesTableProps) {
    const [categories, setCategories] = useState<Category[]>([])
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

    const allSelectedCategories = useRef<Map<string, Category>>(new Map())

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination(pageSize)
    const { sorting, onSortingChange } = useSorting("kind", "asc")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadCategories = useCallback(async () => {
        setIsLoading(true)
        try {
            const { categories: fetchedCategories, pagination: page } = await fetchCategories({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
                kind,
            })
            setCategories(fetchedCategories)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading categories:", error)
            setCategories([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, kind, getCursor, updatePaginationContext])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    useEffect(() => {
        if (onLoadCategoriesRef) {
            onLoadCategoriesRef.current = loadCategories
        }
    }, [loadCategories, onLoadCategoriesRef])

    useEffect(() => {
        if (categories.length > 0) {
            // Update the map with current page selections
            categories.forEach((category) => {
                const id = category.categoryId
                if (rowSelection[id]) {
                    // Add or update selected category
                    allSelectedCategories.current.set(id, category)
                } else if (allSelectedCategories.current.has(id)) {
                    // Remove deselected category
                    allSelectedCategories.current.delete(id)
                }
            })

            // Notify parent with all selected categories (from all pages)
            if (onSelectionChange) {
                onSelectionChange(new Map(allSelectedCategories.current))
            }
        }
    }, [rowSelection, categories, onSelectionChange])

    useEffect(() => {
        allSelectedCategories.current.clear()
    }, [initialSelection])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={categories}
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
            rowId="categoryId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
