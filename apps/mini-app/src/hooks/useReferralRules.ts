import { useState, useEffect } from "react"
import { useRawInitData } from "@tma.js/sdk-react"
import { axiosInstance, withRetry } from "@/lib/api-utils"

export interface ReferralRule {
  levelId: string
  levelName: string | null
  pointsForReferrer: number
  pointsForReferred: number
}

export function useReferralRules(enabled: boolean = true) {
  const [rules, setRules] = useState<ReferralRule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initDataRaw = useRawInitData()

  useEffect(() => {
    let isMounted = true

    const fetchRules = async () => {
      if (!enabled) return
      if (!initDataRaw) {
        if (isMounted) {
          setError("No Telegram initData")
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await withRetry(() =>
          axiosInstance.get<ReferralRule[]>("/levels/referral-rules", {
            headers: {
              Authorization: `tma ${initDataRaw}`,
            },
          })
        )

        if (isMounted) {
          setRules(response.data)
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error("Failed to fetch referral rules:", err)
        if (isMounted) {
          setRules([])
          setError(err.response?.data?.error || "Failed to fetch referral rules")
          setIsLoading(false)
        }
      }
    }

    fetchRules()

    return () => {
      isMounted = false
    }
  }, [initDataRaw, enabled])

  return { rules, isLoading, error }
}
