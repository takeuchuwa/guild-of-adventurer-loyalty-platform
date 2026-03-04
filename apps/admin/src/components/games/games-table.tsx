"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import type { Game } from "@/components/games/types/game"
import { fetchGames } from "@/components/games/api/api.ts"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type React from "react"

interface GamesTableProps {
    columns: CustomColumnDef<Game>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Game>[]
    searchProperties?: UseSearchOptions
    onLoadGamesRef?: React.RefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Game>) => void
}

export function GameTable({
    columns,
    selectionMode = "single",
    title,
    emptyStateMessage = "Не знайдено учасників за вашим запитом",
    actions = [],
    searchProperties,
    onLoadGamesRef,
    onSelectionChange,
}: GamesTableProps) {
    const [games, setGames] = useState<Game[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
    const { sorting, onSortingChange } = useSorting("", "")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadGames = useCallback(async () => {
        setIsLoading(true)
        try {
            const { games: fetchedGames, pagination: page } = await fetchGames({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
            })
            setGames(fetchedGames)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading games:", error)
            setGames([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

    useEffect(() => {
        loadGames()
    }, [loadGames])

    useEffect(() => {
        if (onLoadGamesRef) {
            onLoadGamesRef.current = loadGames
        }
    }, [loadGames, onLoadGamesRef])

    // Notify parent about selection changes
    useEffect(() => {
        if (games.length > 0 && onSelectionChange) {
            const selectedMap = new Map<string, Game>()
            games.forEach((game) => {
                const id = game.gameId
                if (rowSelection[id]) selectedMap.set(id, game)
            })
            onSelectionChange(selectedMap)
        }
    }, [rowSelection, games, onSelectionChange])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={games}
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
            rowId="gameId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
