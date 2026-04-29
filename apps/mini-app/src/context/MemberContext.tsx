import { createContext, useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import type { MemberContextState, Member } from "@/types/member"
import { useRawInitData } from "@tma.js/sdk-react"
import { axiosInstance, withRetry } from "@/lib/api-utils"

export const MemberContext = createContext<MemberContextState | undefined>(undefined)

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initDataRaw = useRawInitData()

  const fetchMember = useCallback(async () => {
    if (!initDataRaw) {
      setError("No Telegram init data found")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await withRetry(() =>
        axiosInstance.get("/members/@self", {
          headers: { Authorization: `tma ${initDataRaw}` },
        })
      )
      setMember(response.data.data || response.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setMember(null) // Not found means they need to register; gracefully handle this
      } else {
        const errorMsg = err.response?.data?.message || err.message || "Failed to fetch member profile"
        setError(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }, [initDataRaw])

  useEffect(() => {
    fetchMember()
  }, [fetchMember])

  return (
    <MemberContext.Provider value={{ member, isLoading, error, refreshMember: fetchMember }}>
      {children}
    </MemberContext.Provider>
  )
}
