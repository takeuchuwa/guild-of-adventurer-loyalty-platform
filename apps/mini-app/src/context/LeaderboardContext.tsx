import { createContext, useCallback, useState, useContext, useRef } from "react"
import type { ReactNode } from "react"
import { useRawInitData } from "@tma.js/sdk-react"
import { axiosInstance, withRetry } from "@/lib/api-utils"

export interface LeaderboardEntry {
  memberId: string
  displayName: string
  pointsBalance: number
  levelId: string
  levelName: string
  isAnonymous: boolean
  isCurrentUser: boolean
}

export interface LeaderboardContextState {
  items: LeaderboardEntry[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadFirstPage: () => Promise<void>
  loadMore: () => Promise<void>
  refreshLeaderboard: () => Promise<void>
}

export const LeaderboardContext = createContext<LeaderboardContextState | undefined>(undefined)

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LeaderboardEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasAttemptedFirstLoad = useRef(false)

  const initDataRaw = useRawInitData()
  const PAGE_SIZE = 20

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!initDataRaw) {
      setError("No Telegram init data found")
      return
    }

    if (isLoadMore && (!hasMore || isLoadingMore)) return
    if (!isLoadMore && isLoading) return

    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const url = new URL("/members/leaderboard", axiosInstance.defaults.baseURL)
      url.searchParams.set("pageSize", PAGE_SIZE.toString())
      if (isLoadMore && nextCursor) {
        url.searchParams.set("cursor", nextCursor)
      }

      const response = await withRetry(() =>
        axiosInstance.get(url.toString(), {
          headers: { Authorization: `tma ${initDataRaw}` }
        })
      )

      const newItems = response.data.data
      const pagination = response.data.pagination

      setItems(prev => isLoadMore ? [...prev, ...newItems] : newItems)
      setNextCursor(pagination.nextCursor)
      setHasMore(pagination.hasNextPage)
    } catch (err: any) {
      setError(err.message || "Failed to fetch leaderboard")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [initDataRaw, hasMore, nextCursor, isLoading, isLoadingMore])

  const loadFirstPage = useCallback(async () => {
    if (hasAttemptedFirstLoad.current) return
    hasAttemptedFirstLoad.current = true
    await loadData(false)
  }, [loadData])

  const loadMore = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  const refreshLeaderboard = useCallback(async () => {
    setNextCursor(null)
    setHasMore(true)
    hasAttemptedFirstLoad.current = false
    setTimeout(() => loadData(false), 0)
  }, [loadData])

  return (
    <LeaderboardContext.Provider
      value={{
        items,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        loadFirstPage,
        loadMore,
        refreshLeaderboard
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  )
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext)
  if (context === undefined) {
    throw new Error("useLeaderboard must be used within a LeaderboardProvider")
  }
  return context
}
