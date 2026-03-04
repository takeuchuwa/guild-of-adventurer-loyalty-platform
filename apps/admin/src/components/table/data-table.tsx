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
}

export type DataTableFilter = {
  component: ReactNode
}

interface DataTableProps<TData, TValue> {
  title?: string
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
}

export function DataTable<TData, TValue>({
  title,
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
              className="rounded-full cursor-pointer"
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
    <div className="space-y-4">
      <TableToolbar<TData>
        table={table}
        title={title}
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

      <div className="rounded-md border relative">
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
                        className={cn("flex items-center", header.column.getCanSort() && "cursor-pointer select-none")}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="ml-2">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 opacity-0 group-hover:opacity-50">
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
                  className={cn(selectionMode !== "none" ? "cursor-pointer" : "", "hover:bg-muted/50")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  {isLoading ? "" : emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

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
    </div>
  )
}

interface TableToolbarProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>
  title?: string
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

  return (
    <div className="space-y-3">
      {title && (
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => action.onClick(selectedRows.map((row) => row.original))}
                  disabled={action.isDisabled ? action.isDisabled(selectedRows.map((row) => row.original)) : false}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative w-full sm:w-64 md:w-80">
              {searchMask ? (
                <InputMask
                  mask={searchMask}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  placeholder={searchPlaceholder}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              ) : (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  className="pr-10"
                />
              )}
              <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={onSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter, index) => (
            <div key={index}>{filter.component}</div>
          ))}
        </div>
      )}
    </div>
  )
}
