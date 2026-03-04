"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Level } from "./types/level-types"
import { fetchLevels } from "./api/level-api"

interface LevelsTableProps {
    columns: CustomColumnDef<Level>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Level>[]
    searchProperties?: UseSearchOptions
    onLoadLevelsRef?: React.RefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Level>) => void
}

export function LevelsTable({
    columns,
    selectionMode = "none",
    title,
    emptyStateMessage = "Не знайдено рівнів за вашим запитом",
    actions = [],
    searchProperties,
    onLoadLevelsRef,
    onSelectionChange,
}: LevelsTableProps) {
    const [levels, setLevels] = useState<Level[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
    const { sorting, onSortingChange } = useSorting("minPoints", "asc")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadLevels = useCallback(async () => {
        setIsLoading(true)
        try {
            const { levels: fetchedLevels, pagination: page } = await fetchLevels({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
            })
            setLevels(fetchedLevels)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading levels:", error)
            setLevels([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

    useEffect(() => {
        loadLevels()
    }, [loadLevels])

    useEffect(() => {
        if (onLoadLevelsRef) {
            onLoadLevelsRef.current = loadLevels
        }
    }, [loadLevels, onLoadLevelsRef])

    useEffect(() => {
        if (levels.length > 0 && onSelectionChange) {
            const selectedMap = new Map<string, Level>()
            levels.forEach((level) => {
                const id = level.levelId
                if (rowSelection[id]) selectedMap.set(id, level)
            })
            onSelectionChange(selectedMap)
        }
    }, [rowSelection, levels, onSelectionChange])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={levels}
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
            rowId="levelId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
