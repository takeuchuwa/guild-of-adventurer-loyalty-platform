"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import { Button } from "@/components/ui/button"
import type { UnclaimedPrizeRow } from "@/components/members/api/api"
import { fetchUnclaimedPrizes, claimMemberPrize } from "@/components/members/api/api"
import { useSearch } from "@/hooks/use-search"
import { toast } from "sonner"
import type { CustomColumnDef } from "@/types/table"
import { Loader2 } from "lucide-react"

type UnclaimedPrizeItem = UnclaimedPrizeRow & { id: string }

export function UnclaimedPrizesTable() {
    const [rows, setRows] = useState<UnclaimedPrizeItem[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [claimingState, setClaimingState] = useState<Record<string, boolean>>({})

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
    const { sorting, onSortingChange } = useSorting("", "")
    const { currentSearch, searchProps } = useSearch({
        searchPlaceholder: "Пошук за номером...",
        searchMask: "+38 (099) 999-99-99",
        searchDefaultValue: "+380",
    })

    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const { entries, pagination: page } = await fetchUnclaimedPrizes({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
            })
            setRows(entries.map(e => ({ ...e, id: `${e.memberId}-${e.levelId}` })))
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading unclaimed prizes:", error)
            setRows([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleClaim = async (memberId: string, levelId: string) => {
        const key = `${memberId}-${levelId}`
        setClaimingState(prev => ({ ...prev, [key]: true }))
        try {
            await claimMemberPrize(memberId, levelId)
            toast.success("Приз видано")
            loadData()
        } catch (error: any) {
            toast.error(error?.message || "Не вдалося видати приз")
            setClaimingState(prev => ({ ...prev, [key]: false }))
        }
    }

    const columns: CustomColumnDef<UnclaimedPrizeItem>[] = [
        {
            accessorKey: "firstName",
            header: "Ім'я",
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.firstName} {row.original.lastName}
                </span>
            ),
            size: 20,
        },
        {
            accessorKey: "phone",
            header: "Телефон",
            size: 20,
            enableSorting: false,
        },
        {
            accessorKey: "levelName",
            header: "Рівень",
            minSize: 10,
            size: 10,
        },
        {
            accessorKey: "prizesString",
            header: "Призи",
            size: 30,
            enableSorting: false,
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const item = row.original
                const isClaiming = claimingState[item.id]
                return (
                    <div className="flex justify-end">
                        <Button className="cursor-pointer w-3xs" size="sm" onClick={() => handleClaim(item.memberId, item.levelId)} disabled={isClaiming}>
                            {isClaiming && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Видати
                        </Button>
                    </div>
                )
            },
            size: 20,
            enableSorting: false,
        },
    ]

    return (
        <DataTable
            title="Неотримані призи"
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
            rowCount={context.total ?? -1}
            isLoading={isLoading}
            selectionMode="none"
            emptyStateMessage="Немає не отриманих призів"
            rowId="id"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
