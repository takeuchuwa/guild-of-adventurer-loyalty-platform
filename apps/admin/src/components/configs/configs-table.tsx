"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import type { LoyaltyConfig } from "@/components/configs/api/configs-api"
import { fetchConfigs } from "@/components/configs/api/configs-api"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"

interface ConfigsTableProps {
  columns: CustomColumnDef<LoyaltyConfig>[]
  selectionMode?: "single" | "multiple" | "none"
  title?: string
  emptyStateMessage?: string
  actions?: DataTableAction<LoyaltyConfig>[]
  searchProperties?: UseSearchOptions
  onLoadRef?: React.RefObject<(() => Promise<void>) | null>
}

export function ConfigsTable({
  columns,
  selectionMode = "none",
  title,
  emptyStateMessage = "Конфігурацій не знайдено",
  actions = [],
  searchProperties,
  onLoadRef,
}: ConfigsTableProps) {
  const [rows, setRows] = useState<LoyaltyConfig[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
  const { sorting, onSortingChange } = useSorting("updatedAt", "desc")
  const { currentSearch, searchProps } = useSearch(searchProperties)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, pagination: page } = await fetchConfigs({
        pageSize: pagination.pageSize,
        cursor: getCursor(pagination.pageIndex),
        includeCount: getIncludeCount(),
        sort: sorting.length && sorting[0]?.id ? `${sorting[0]?.id || "updatedAt"},${sorting[0]?.desc ? "desc" : "asc"}` : undefined,
        q: currentSearch || undefined,
      })
      setRows(data)
      updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
    } catch (e) {
      console.error("Failed to load configs", e)
      setRows([])
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (onLoadRef) onLoadRef.current = load }, [load, onLoadRef])

  return (
    <DataTable
      title={title}
      columns={columns}
      data={rows}
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
      rowId="configId"
      {...searchProps}
      onSimpleSearch={(query) => {
        searchProps.onSimpleSearch(query);
        resetCursors();
      }}
    />
  )
}
