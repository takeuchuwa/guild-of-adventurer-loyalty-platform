"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Gift, BadgePercent, ShieldCheck } from "lucide-react"
import { claimMemberPrize, getMemberLevelInfo, type LevelInfoResponse } from "@/components/members/api/api"

interface LevelInfoCardProps {
  memberId: string
}

function formatDiscount(amount?: number, fixed?: boolean): string | null {
  const a = amount || 0
  if (a <= 0) return null
  return fixed ? `${a}₴` : `${a}%`
}

export function LevelInfoCard({ memberId }: LevelInfoCardProps) {
  const [data, setData] = useState<LevelInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMemberLevelInfo(memberId)
      setData(res)
    } catch (e: any) {
      console.error("[LevelInfoCard] load error", e)
      setError(e?.message || "Помилка завантаження")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (memberId) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  const discounts = useMemo(() => {
    if (!data) return [] as string[]
    const lines: string[] = []
    const p = formatDiscount(data.level.discountProducts, data.level.fixedProducts)
    const a = formatDiscount(data.level.discountActivities, data.level.fixedActivities)
    const g = formatDiscount(data.level.discountGames, data.level.fixedGames)
    if (p) lines.push(`На товари: ${p}`)
    if (a) lines.push(`На активності: ${a}`)
    if (g) lines.push(`На системи: ${g}`)
    if (lines.length === 0) lines.push("Немає знижок на цьому рівні")
    return lines
  }, [data])

  const handleClaim = async (levelId: string) => {
    if (!data) return
    setClaiming(levelId)
    try {
      await claimMemberPrize(memberId, levelId)
      toast.success("Приз видано")
      // Remove this level from unclaimed
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unclaimedLevelPrizes: prev.unclaimedLevelPrizes?.filter((p) => p.levelId !== levelId),
        }
      })
    } catch (e: any) {
      console.error("[LevelInfoCard] claim error", e)
      toast.error(e?.message || "Не вдалося видати приз")
    } finally {
      setClaiming(null)
    }
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" /> Рівень і призи
        </CardTitle>
        <CardDescription>
          Перегляд знижок, бенефітів та призів для поточного рівня учасника.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col gap-3">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={load}>Спробувати ще раз</Button>
          </div>
        ) : !data ? (
          <p className="text-muted-foreground">Немає даних</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Рівень</div>
              <div className="text-xl font-semibold">{data.level.name}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 font-medium"><BadgePercent className="h-4 w-4" />Знижки</div>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {discounts.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-medium">Бенефіти</div>
              {data.benefits.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Немає бенефітів на цьому рівні</p>
              ) : (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {data.benefits.map((b, idx) => (
                    <li key={idx}>
                      {b.name || "(без назви)"}
                      {b.description ? <span className="text-muted-foreground"> — {b.description}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="font-medium">Призи (Поточний рівень)</div>
              {data.prizes.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Немає призів на цьому рівні</p>
              ) : (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {data.prizes.map((p, idx) => (
                    <li key={idx}>
                      {p.name || "(без назви)"}
                      {p.description ? <span className="text-muted-foreground"> — {p.description}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="font-medium">Доступні для отримання</div>
              {data.unclaimedLevelPrizes && data.unclaimedLevelPrizes.length > 0 ? (
                <div className="mt-2 flex flex-col gap-3">
                  {data.unclaimedLevelPrizes.map((ul) => (
                    <div key={ul.levelId} className="flex flex-col gap-2 rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{ul.levelName}</span>
                        <Button
                          size="sm"
                          onClick={() => handleClaim(ul.levelId)}
                          disabled={claiming === ul.levelId}
                        >
                          {claiming === ul.levelId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Видати
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">{ul.prizesString}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-500 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Всі призи видано</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
