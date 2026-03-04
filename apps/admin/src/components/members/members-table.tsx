"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import { usePagination } from "@/hooks/use-pagination"
import { useSorting } from "@/hooks/use-sorting"
import type { CustomColumnDef } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"
import type { Member } from "@/components/members/types/member"
import { fetchMembers } from "@/components/members/api/api.ts"
import { useSearch } from "@/hooks/use-search"

interface MembersTableProps {
  columns: CustomColumnDef<Member>[]
  selectionMode?: "single" | "multiple" | "none"
  title?: string
  emptyStateMessage?: string
  actions?: DataTableAction<Member>[]
  searchPlaceholder?: string
  onLoadMembersRef?: React.MutableRefObject<(() => Promise<void>) | null>
  onSelectionChange?: (selected: Map<string, Member>) => void
  initialSelection?: string[]
}

export function MemberTable({
  columns,
  selectionMode = "single",
  title,
  emptyStateMessage = "Не знайдено учасників за вашим запитом",
  actions = [],
  searchPlaceholder,
  onLoadMembersRef,
  onSelectionChange,
  initialSelection,
}: MembersTableProps) {
  const [members, setMembers] = useState<Member[]>([])
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

  const allSelectedMembers = useRef<Map<string, Member>>(new Map())

  const { pagination, onPaginationChange, context, getCursor, getIncludeCount, updatePaginationContext, triggerCountFetch, resetCursors } = usePagination()
  const { sorting, onSortingChange } = useSorting("", "")
  const { currentSearch, searchProps } = useSearch({
    searchPlaceholder,
    searchMask: "+38 (099) 999-99-99",
    searchDefaultValue: "+380",
  })

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { members: fetchedMembers, pagination: page } = await fetchMembers({
        pagination: {
          pageSize: pagination.pageSize,
          cursor: getCursor(pagination.pageIndex),
          includeCount: getIncludeCount(),
        },
        sorting,
        currentSearch: currentSearch || undefined,
      })
      setMembers(fetchedMembers)
      updatePaginationContext(page.hasNextPage, page.nextCursor, page.total)
    } catch (error) {
      console.error("Error loading members:", error)
      setMembers([])
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [pagination, sorting, currentSearch, getCursor, updatePaginationContext])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  useEffect(() => {
    if (onLoadMembersRef) {
      onLoadMembersRef.current = loadMembers
    }
  }, [loadMembers, onLoadMembersRef])

  // Notify parent about selection changes (cross-page tracking)
  useEffect(() => {
    if (members.length > 0) {
      members.forEach((member) => {
        const id = member.memberId
        if (rowSelection[id]) {
          allSelectedMembers.current.set(id, member)
        } else if (allSelectedMembers.current.has(id)) {
          allSelectedMembers.current.delete(id)
        }
      })

      if (onSelectionChange) {
        onSelectionChange(new Map(allSelectedMembers.current))
      }
    }
  }, [rowSelection, members, onSelectionChange])

  useEffect(() => {
    allSelectedMembers.current.clear()
  }, [initialSelection])

  return (
    <DataTable
      title={title}
      columns={columns}
      data={members}
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
      rowId="memberId"
      {...searchProps}
      onSimpleSearch={(query) => {
        searchProps.onSimpleSearch(query);
        resetCursors();
      }}
    />
  )
}
