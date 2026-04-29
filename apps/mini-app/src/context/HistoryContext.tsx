import { createContext, useCallback, useState, useContext } from "react"
import type { ReactNode } from "react"
import { useRawInitData } from "@tma.js/sdk-react"
import { axiosInstance, withRetry } from "@/lib/api-utils"

export interface HistoryEntry {
  entryId: string
  delta: number
  balanceAfter: number
  occurredAt: number
  activity?: { name: string; hasGame: boolean } | null
  game?: { name: string } | null
  product?: { name: string } | null
  promo?: { name: string } | null
  adminNote?: string | null
}

export interface HistoryContextState {
  items: HistoryEntry[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadFirstPage: () => Promise<void>
  loadMore: () => Promise<void>
  refreshHistory: () => Promise<void>
}

export const HistoryContext = createContext<HistoryContextState | undefined>(undefined)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track if we've already loaded the first page to avoid double-fetching
  const [isInitialized, setIsInitialized] = useState(false)

  const initDataRaw = useRawInitData()
  const PAGE_SIZE = 10

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!initDataRaw) {
      setError("No Telegram init data found")
      return
    }

    // Skip if already loading or no more items
    if (isLoadMore && (!hasMore || isLoadingMore)) return
    if (!isLoadMore && isLoading) return

    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const url = new URL("/members/@self/history", axiosInstance.defaults.baseURL)
      url.searchParams.set("pageSize", PAGE_SIZE.toString())
      if (isLoadMore && nextCursor) {
        url.searchParams.set("cursor", nextCursor)
      }

      const response = await withRetry(() =>
        axiosInstance.get(url.toString(), {
          headers: { Authorization: `tma ${initDataRaw}` },
        })
      )

      const newItems = response.data.data
      const pagination = response.data.pagination
      setItems(prev => isLoadMore ? [...prev, ...newItems] : newItems)
      setNextCursor(pagination.nextCursor)
      setHasMore(pagination.hasNextPage)
    } catch (err: any) {
      setError(err.message || "Failed to fetch history")
    } finally {
      if (!isLoadMore) setIsInitialized(true)
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [initDataRaw, hasMore, nextCursor, isLoading, isLoadingMore])

  const loadFirstPage = useCallback(async () => {
    if (isInitialized) return
    await loadData(false)
  }, [isInitialized, loadData])

  const loadMore = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  const refreshHistory = useCallback(async () => {
    setNextCursor(null)
    setHasMore(true)
    setIsInitialized(false)
    // small timeout to ensure state settles
    setTimeout(() => loadData(false), 0)
  }, [loadData])

  return (
    <HistoryContext.Provider
      value={{
        items,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        loadFirstPage,
        loadMore,
        refreshHistory
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider")
  }
  return context
}
