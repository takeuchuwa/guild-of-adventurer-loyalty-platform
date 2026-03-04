"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { DataTable, type DataTableAction, type DataTableFilter } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Promotion } from "@/components/promotions/types/promotion.ts"
import { fetchPromotions } from "@/components/promotions/api/promotions.ts"

interface PromotionsTableProps {
    columns: CustomColumnDef<Promotion>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Promotion>[]
    filters?: DataTableFilter[]
    searchProperties?: UseSearchOptions
    onLoadPromotionsRef?: React.MutableRefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Promotion>) => void
    filterParams?: Record<string, any>
    staticData?: Promotion[]
}

export function PromotionsTable({
    columns,
    selectionMode = "single",
    title,
    emptyStateMessage = "Не знайдено промоакцій за вашим запитом",
    actions = [],
    searchProperties,
    onLoadPromotionsRef,
    onSelectionChange,
    staticData,
}: PromotionsTableProps) {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
    const { sorting, onSortingChange } = useSorting("createdAt", "desc")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadPromotions = useCallback(async () => {
        if (staticData) {
            setPromotions(staticData)
            setTotalElements(staticData.length)
            return
        }

        setIsLoading(true)
        try {
            const { promotions: fetchedPromotions, pagination: page } = await fetchPromotions({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
            })
            setPromotions(fetchedPromotions)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading promotions:", error)
            setPromotions([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, staticData, getCursor, updatePaginationContext])

    useEffect(() => {
        loadPromotions()
    }, [loadPromotions])

    useEffect(() => {
        if (onLoadPromotionsRef) {
            onLoadPromotionsRef.current = loadPromotions
        }
    }, [loadPromotions, onLoadPromotionsRef])

    // Notify parent about selection changes
    useEffect(() => {
        if (promotions.length > 0 && onSelectionChange) {
            const selectedMap = new Map<string, Promotion>()
            promotions.forEach((p) => {
                const id = p.promoId
                if (rowSelection[id]) selectedMap.set(id, p)
            })
            onSelectionChange(selectedMap)
        }
    }, [rowSelection, promotions, onSelectionChange])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={promotions}
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
            rowCount={staticData ? totalElements : (context.total ?? -1)}
            isLoading={isLoading}
            selectionMode={selectionMode}
            emptyStateMessage={emptyStateMessage}
            actions={actions}
            rowId="promoId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
