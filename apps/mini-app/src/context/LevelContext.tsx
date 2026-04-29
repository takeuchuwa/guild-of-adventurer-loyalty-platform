import { createContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useRawInitData } from "@tma.js/sdk-react"
import { axiosInstance, withRetry } from "@/lib/api-utils"

export interface LevelTier {
  levelId: string
  name: string
  minPoints: number
  sortOrder: number
  defaultLevel: boolean
  benefits: any[]
  prizes: any[]
  promotions: any[]
}

export interface LevelContextState {
  levels: LevelTier[]
  isLoading: boolean
  error: string | null
}

const initialState: LevelContextState = {
  levels: [],
  isLoading: true,
  error: null,
}

export const LevelContext = createContext<LevelContextState | undefined>(undefined)

export function LevelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LevelContextState>(initialState)
  const initDataRaw = useRawInitData()

  useEffect(() => {
    let isMounted = true

    const fetchLevels = async () => {
      if (!initDataRaw) {
        setState((prev) => ({ ...prev, isLoading: false, error: "No Telegram initData" }))
        return
      }

      try {
        const response = await withRetry(() =>
          axiosInstance.get<LevelTier[]>("/levels/info", {
            headers: {
              Authorization: `tma ${initDataRaw}`,
            },
          })
        )

        if (isMounted) {
          setState({
            levels: response.data,
            isLoading: false,
            error: null,
          })
        }
      } catch (err: any) {
        console.error("Failed to fetch levels:", err)
        if (isMounted) {
          setState({
            levels: [],
            isLoading: false,
            error: err.response?.data?.error || "Failed to fetch levels",
          })
        }
      }
    }

    fetchLevels()

    return () => {
      isMounted = false
    }
  }, [initDataRaw])

  return <LevelContext.Provider value={state}>{children}</LevelContext.Provider>
}
