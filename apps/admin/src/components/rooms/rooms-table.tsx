"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Room } from "./types/room"
import { fetchRooms } from "./api/room-api"
import type React from "react"

interface RoomsTableProps {
    columns: CustomColumnDef<Room>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Room>[]
    searchProperties?: UseSearchOptions
    onLoadRoomsRef?: React.RefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Room>) => void
}

export function RoomsTable({
    columns,
    selectionMode = "single",
    title,
    emptyStateMessage = "Не знайдено кімнат за вашим запитом",
    actions = [],
    searchProperties,
    onLoadRoomsRef,
    onSelectionChange,
}: RoomsTableProps) {
    const [rooms, setRooms] = useState<Room[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
    const { sorting, onSortingChange } = useSorting("name", "asc")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadRooms = useCallback(async () => {
        setIsLoading(true)
        try {
            const { rooms: fetchedRooms, pagination: page } = await fetchRooms({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
            })
            setRooms(fetchedRooms)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading rooms:", error)
            setRooms([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

    useEffect(() => {
        loadRooms()
    }, [loadRooms])

    useEffect(() => {
        if (onLoadRoomsRef) {
            onLoadRoomsRef.current = loadRooms
        }
    }, [loadRooms, onLoadRoomsRef])

    useEffect(() => {
        if (rooms.length > 0 && onSelectionChange) {
            const selectedMap = new Map<string, Room>()
            rooms.forEach((room) => {
                const id = room.roomId
                if (rowSelection[id]) selectedMap.set(id, room)
            })
            onSelectionChange(selectedMap)
        }
    }, [rowSelection, rooms, onSelectionChange])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={rooms}
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
            rowId="roomId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
