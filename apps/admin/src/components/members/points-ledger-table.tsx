"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { PointsLedgerEntry } from "@/components/members/types/points-ledger"
import { fetchPointsLedger } from "@/components/members/api/api"
import { pointsLedgerColumns } from "@/components/members/columns/points-ledger-columns"

interface PointsLedgerTableProps {
    memberId: string
    onLoadLedger?: (reload: () => Promise<void>) => void
}

export function PointsLedgerTable({ memberId, onLoadLedger }: PointsLedgerTableProps) {
    const [entries, setEntries] = useState<PointsLedgerEntry[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination(5)
    const { sorting, onSortingChange } = useSorting("occurredAt", "desc")

    const loadLedger = useCallback(async () => {
        setIsLoading(true)
        try {
            const { entries: fetchedEntries, pagination: page } = await fetchPointsLedger({
                memberId,
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
            })
            setEntries(fetchedEntries)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading points ledger:", error)
            setEntries([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [memberId, pagination, sorting, getCursor, updatePaginationContext])

    useEffect(() => {
        loadLedger()
    }, [loadLedger])

    // Expose reload to parent
    useEffect(() => {
        if (onLoadLedger) onLoadLedger(loadLedger)
    }, [onLoadLedger, loadLedger])

    return (
        <DataTable
            title="Історія балів"
            columns={pointsLedgerColumns}
            data={entries}
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
            rowCount={context.total ?? -1}
            isLoading={isLoading}
            selectionMode="none"
            emptyStateMessage="Історія балів порожня"
            rowId="entryId"
        />
    )
}
