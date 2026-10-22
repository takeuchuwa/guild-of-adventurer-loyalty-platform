"use client"

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
} from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type HeaderContext,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { TablePagination } from "@/components/table/pagination"
import type { CustomColumnDef } from "@/types/table"
import { Input } from "@/components/ui/input"
import InputMask from "react-input-mask"

export type DataTableAction<TData> = {
  label: string
  icon?: ReactNode
  onClick: (selectedRows: TData[]) => void
  isDisabled?: (selectedRows: TData[]) => boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "destructiveOutline"
  /**
   * `global` actions sit next to the page title and are always available.
   * `selection` actions live on the right of the toolbar and only appear once
   * rows are selected. Defaults to `selection` for any action that declares
   * `isDisabled` (those are the ones that read the selection), `global` otherwise.
   */
  scope?: "global" | "selection"
}

function actionScope<TData>(action: DataTableAction<TData>): "global" | "selection" {
  return action.scope ?? (action.isDisabled ? "selection" : "global")
}

export type DataTableFilter = {
  component: ReactNode
}

interface DataTableProps<TData, TValue> {
  title?: string
  /** `page` renders the Oswald page title; `section` for tables embedded in a screen. */
  titleVariant?: "page" | "section"
  columns: CustomColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: {
    pagination: PaginationState;
    onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>;
    hasNextPage?: boolean;
    onCalculateTotal?: () => void;
    total?: number;
  };
  sorting?: {
    sorting: SortingState
    onSortingChange: Dispatch<SetStateAction<SortingState>>
  }
  rowSelection?: {
    rowSelection: RowSelectionState
    onRowSelectionChange: Dispatch<SetStateAction<RowSelectionState>>
  }
  rowCount?: number
  isLoading?: boolean
  selectionMode?: "single" | "multiple" | "none"
  actions?: DataTableAction<TData>[]
  filters?: DataTableFilter[]
  searchPlaceholder?: string
  onSimpleSearch?: (searchQuery: string) => void
  emptyStateMessage?: string
  rowId?: keyof TData
  searchMask?: string
  searchDefaultValue?: string
  meta?: Record<string, any>
}

export function DataTable<TData, TValue>({
  title,
  titleVariant = "page",
  columns,
  data,
  pagination,
  sorting,
  rowCount,
  isLoading = false,
  selectionMode = "none",
  actions = [],
  filters = [],
  searchPlaceholder = "Search...",
  onSimpleSearch,
  emptyStateMessage = "No results found",
  rowSelection,
  rowId,
  searchMask,
  searchDefaultValue = "",
  meta,
}: DataTableProps<TData, TValue>) {
  const [searchValue, setSearchValue] = useState(searchDefaultValue)

  const tableColumns = useMemo(() => {
    if (selectionMode === "none") return columns

    const selectionColumn = {
      id: "select",
      size: 2,
      minSize: 2,
      header:
        selectionMode === "multiple"
          ? ({ table }: HeaderContext<TData, TValue>) => (
            <Checkbox
              className="cursor-pointer"
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          )
          : "",
      accessorKey: "select",
      cell: ({ row }: { row: Row<TData> }) => {
        if (selectionMode === "multiple") {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              className="cursor-pointer"
              aria-label="Select row"
            />
          )
        } else if (selectionMode === "single") {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              className="cursor-pointer"
              aria-label="Select row"
            />
          )
        }
        return null
      },
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, selectionMode])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      ...(sorting ? { sorting: sorting.sorting } : {}),
      ...(pagination ? { pagination: pagination.pagination } : {}),
      ...(rowSelection ? { rowSelection: rowSelection.rowSelection } : {}),
    },
    enableRowSelection: selectionMode !== "none",
    enableMultiRowSelection: selectionMode === "multiple",
    onRowSelectionChange: rowSelection?.onRowSelectionChange,
    onSortingChange: sorting?.onSortingChange,
    onPaginationChange: pagination?.onPaginationChange,
    rowCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    manualPagination: !!pagination,
    manualSorting: !!sorting,
    enableSorting: !!sorting,
    getRowId: rowId ? (row) => row[rowId] as unknown as string : undefined,
    meta,
  })

  const handleRowClick = useCallback((row: Row<TData>, event: MouseEvent) => {
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === "A" || event.target.closest("a") || event.target.closest("[data-no-select]"))
    ) {
      return
    }

    row.toggleSelected()
  }, [])

  const stripMask = useCallback((value: string) => {
    return value.replace(/[^0-9+]/g, "")
  }, [])

  const handleSearch = useCallback(() => {
    if (onSimpleSearch) {
      const cleanValue = searchMask ? stripMask(searchValue) : searchValue.trim()
      onSimpleSearch(cleanValue)
    }
  }, [onSimpleSearch, searchValue, searchMask, stripMask])

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <TableToolbar<TData>
        table={table}
        title={title}
        titleVariant={titleVariant}
        actions={actions}
        filters={filters}
        selectionMode={selectionMode}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onSearch={handleSearch}
        showSearch={!!onSimpleSearch}
        searchMask={searchMask}
      />

      {/* One hairline frame around header, rows and the footer strip. */}
      <div className="border-hairline relative flex min-w-0 flex-col border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.column.getSize()}%` }}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn("group flex items-center", header.column.getCanSort() && "cursor-pointer select-none")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="ml-2">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <div className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50">
                                <ChevronUp className="h-2 w-2" />
                                <ChevronDown className="h-2 w-2" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => handleRowClick(row, e)}
                  className={cn(selectionMode !== "none" ? "cursor-pointer" : "")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={tableColumns.length} className="text-muted-foreground h-24 text-center">
                  {isLoading ? "" : emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {pagination && (
          <TablePagination
            pagination={pagination.pagination}
            onPaginationChange={pagination.onPaginationChange}
            sizes={[5, 10, 20, 50]}
            hasNextPage={pagination.hasNextPage}
            onCalculateTotal={pagination.onCalculateTotal}
            total={pagination.total}
          />
        )}

        {isLoading && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

interface TableToolbarProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>
  title?: string
  titleVariant: "page" | "section"
  actions: DataTableAction<TData>[]
  filters: DataTableFilter[]
  selectionMode: "single" | "multiple" | "none"
  searchPlaceholder: string
  searchValue: string
  setSearchValue: (value: string) => void
  onSearch: () => void
  showSearch: boolean
  searchMask?: string
}

function TableToolbar<TData>({
  table,
  title,
  titleVariant,
  actions,
  filters,
  searchPlaceholder,
  searchValue,
  setSearchValue,
  onSearch,
  showSearch,
  searchMask,
}: TableToolbarProps<TData>) {
  const selectedRows = table.getSelectedRowModel().rows
  const selectedData = useMemo(() => selectedRows.map((row) => row.original), [selectedRows])
  const selectedCount = selectedRows.length

  const globalActions = actions.filter((action) => actionScope(action) === "global")
  const selectionActions = actions.filter((action) => actionScope(action) === "selection")

  const renderAction = (action: DataTableAction<TData>, index: number, fallbackVariant: "default" | "outline" | "secondary") => (
    <Button
      key={index}
      variant={action.variant || fallbackVariant}
      size="sm"
      onClick={() => action.onClick(selectedData)}
      disabled={action.isDisabled ? action.isDisabled(selectedData) : false}
      className="flex cursor-pointer items-center gap-1"
    >
      {action.icon && <span className="mr-1">{action.icon}</span>}
      {action.label}
    </Button>
  )

  return (
    <div className="flex flex-col gap-5">
      {(title || globalActions.length > 0) && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          {title &&
            (titleVariant === "page" ? (
              <h1 className="font-heading text-[40px] leading-none font-bold uppercase tracking-[.03em]">{title}</h1>
            ) : (
              <h2 className="font-heading text-[20px] leading-none font-semibold uppercase tracking-[.06em]">{title}</h2>
            ))}
          {globalActions.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-2.5">
              {/* The first global action is the screen's single filled gold button. */}
              {globalActions.map((action, index) => renderAction(action, index, index === 0 ? "default" : "outline"))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {showSearch && (
          <div className="relative w-full sm:w-72 md:w-80">
            {searchMask ? (
              <InputMask
                mask={searchMask}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder={searchPlaceholder}
                className="bg-surface flex h-[42px] w-full border border-[rgba(201,158,58,.28)] px-3.5 py-1 pr-10 font-mono text-[13px] transition-colors outline-none placeholder:text-foreground/40 focus-visible:border-primary focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
              />
            ) : (
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                className="bg-surface h-[42px] border-[rgba(201,158,58,.28)] pr-10 text-[14px]"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary absolute top-0 right-0 h-full cursor-pointer px-3 hover:bg-transparent"
              onClick={onSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        {filters.map((filter, index) => (
          <div key={index}>{filter.component}</div>
        ))}

        {/* Bulk actions surface only once something is selected. */}
        {selectionActions.length > 0 && selectedCount > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <span className="text-primary font-heading text-[12px] font-semibold uppercase tracking-[.14em]">
              Обрано <span className="font-mono">{selectedCount}</span>
            </span>
            {selectionActions.map((action, index) => renderAction(action, index, "secondary"))}
          </div>
        )}
      </div>
    </div>
  )
}
