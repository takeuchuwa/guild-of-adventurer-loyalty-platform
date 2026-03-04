"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DataTable, type DataTableAction, type DataTableFilter } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import { useSearch, type UseSearchOptions } from "@/hooks/use-search"
import type { Activity } from "@/components/activities/types/activity.tsx"
import { fetchActivities } from "@/components/activities/api/activity-api.ts"

const EMPTY_FILTER_PARAMS: Record<string, any> = {}

interface ActivitiesTableProps {
    columns: CustomColumnDef<Activity>[]
    selectionMode?: "single" | "multiple" | "none"
    title?: string
    emptyStateMessage?: string
    actions?: DataTableAction<Activity>[]
    filters?: DataTableFilter[]
    searchProperties?: UseSearchOptions
    onLoadActivitiesRef?: React.MutableRefObject<(() => Promise<void>) | null>
    onSelectionChange?: (selected: Map<string, Activity>) => void
    filterParams?: Record<string, any>
    initialSelection?: string[]
    pageSize?: number
}

export function ActivityTable({
    columns,
    selectionMode = "single",
    title,
    emptyStateMessage = "Не знайдено учасників за вашим запитом",
    actions = [],
    filters = [],
    searchProperties,
    onLoadActivitiesRef,
    onSelectionChange,
    filterParams = EMPTY_FILTER_PARAMS,
    initialSelection,
    pageSize = 10,
}: ActivitiesTableProps) {
    const [activities, setActivities] = useState<Activity[]>([])
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

    const allSelectedActivities = useRef<Map<string, Activity>>(new Map())

    const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination(pageSize)
    const { sorting, onSortingChange } = useSorting("startDate", "desc")
    const { currentSearch, searchProps } = useSearch(searchProperties)

    const loadActivities = useCallback(async () => {
        setIsLoading(true)
        try {
            const { activities: fetchedActivities, pagination: page } = await fetchActivities({
                pagination: {
                    pageSize: pagination.pageSize,
                    cursor: getCursor(pagination.pageIndex),
                    includeCount: getIncludeCount(),
                },
                sorting,
                currentSearch: currentSearch || undefined,
                filterParams,
            })
            setActivities(fetchedActivities)
            updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
        } catch (error) {
            console.error("Error loading activities:", error)
            setActivities([])
            setTotalElements(0)
        } finally {
            setIsLoading(false)
        }
    }, [pagination, sorting, currentSearch, filterParams, getCursor, updatePaginationContext])

    useEffect(() => {
        loadActivities()
    }, [loadActivities])

    useEffect(() => {
        if (onLoadActivitiesRef) {
            onLoadActivitiesRef.current = loadActivities
        }
    }, [loadActivities, onLoadActivitiesRef])

    // Notify parent about selection changes (cross-page tracking)
    useEffect(() => {
        if (activities.length > 0) {
            activities.forEach((activity) => {
                const id = activity.activityId
                if (rowSelection[id]) {
                    allSelectedActivities.current.set(id, activity)
                } else if (allSelectedActivities.current.has(id)) {
                    allSelectedActivities.current.delete(id)
                }
            })

            if (onSelectionChange) {
                onSelectionChange(new Map(allSelectedActivities.current))
            }
        }
    }, [rowSelection, activities, onSelectionChange])

    useEffect(() => {
        allSelectedActivities.current.clear()
    }, [initialSelection])

    return (
        <DataTable
            title={title}
            columns={columns}
            data={activities}
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
            rowId="activityId"
            {...searchProps}
            onSimpleSearch={(query) => {
                searchProps.onSimpleSearch(query);
                resetCursors();
            }}
        />
    )
}
