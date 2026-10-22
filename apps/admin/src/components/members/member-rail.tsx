"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { claimMemberPrize, getMemberLevelInfo, type LevelInfoResponse } from "@/components/members/api/api"
import { MemberTower } from "@/components/members/member-tower"
import { Overline, overlineMutedClass } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import type { Member } from "@/components/members/types/member"

interface MemberRailProps {
  member: Member
}

function formatDiscount(amount?: number, fixed?: boolean): string | null {
  const a = amount || 0
  if (a <= 0) return null
  return fixed ? `${a}₴` : `${a}%`
}

/** `numeric` off for stats whose value is a word (level name), not a figure. */
function Stat({ value, label, numeric = true }: { value: string; label: string; numeric?: boolean }) {
  return (
    <div className="bg-surface px-4 py-4">
      <div
        className={
          numeric
            ? "font-mono text-[20px] leading-none font-bold"
            : "font-heading truncate text-[20px] leading-none font-semibold uppercase tracking-[.02em]"
        }
      >
        {value}
      </div>
      <div className={cn(overlineMutedClass, "mt-2")}>{label}</div>
    </div>
  )
}

/**
 * Left rail of the member card: identity, the tower, the mono stat grid and the
 * level's benefits/prizes — including the single gold «Видати» action.
 */
export function MemberRail({ member }: MemberRailProps) {
  const [data, setData] = useState<LevelInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const memberId = member.memberId

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getMemberLevelInfo(memberId)
      setData(res)
    } catch (e: any) {
      console.error("[MemberRail] load error", e)
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
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unclaimedLevelPrizes: prev.unclaimedLevelPrizes?.filter((p) => p.levelId !== levelId),
        }
      })
    } catch (e: any) {
      console.error("[MemberRail] claim error", e)
      toast.error(e?.message || "Не вдалося видати приз")
    } finally {
      setClaiming(null)
    }
  }

  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "—"
  const initial = (member.firstName?.trim()?.[0] || member.lastName?.trim()?.[0] || "?").toUpperCase()
  const unclaimed = data?.unclaimedLevelPrizes ?? []

  return (
    <div className="flex flex-col gap-[26px]">
      <div className="flex items-center gap-4">
        <span className="border-primary font-heading flex size-[66px] shrink-0 items-center justify-center rounded-full border-2 text-[26px] text-primary">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="font-heading text-[28px] leading-[1.05] font-semibold uppercase tracking-[.03em]">{fullName}</div>
          <div className="text-foreground/50 mt-1.5 font-mono text-[12px]">
            {member.phone} · ID {member.memberId}
          </div>
        </div>
      </div>

      <MemberTower levelId={member.levelId} pointsBalance={member.pointsBalance} />

      <div className="grid grid-cols-2 gap-px bg-[rgba(201,158,58,.18)]">
        <Stat value={member.pointsBalance.toLocaleString("uk-UA")} label="Баланс балів" />
        <Stat value={new Date(member.joinedAt * 1000).toLocaleDateString("uk-UA")} label="Дата приєднання" />
        <Stat value={data?.level.name || "—"} label="Рівень" numeric={false} />
        <Stat value={String(unclaimed.length)} label="Незабрані призи" />
      </div>

      {loading ? (
        <div className="text-muted-foreground flex h-24 items-center justify-center">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={load} className="cursor-pointer">
            Спробувати ще раз
          </Button>
        </div>
      ) : !data ? (
        <p className="text-muted-foreground text-sm">Немає даних</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <Overline>Знижки</Overline>
            <ul className="text-foreground/75 flex flex-col gap-1.5 text-[14px]">
              {discounts.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Overline>Бенефіти</Overline>
            {data.benefits.length === 0 ? (
              <p className="text-muted-foreground text-[14px]">Немає бенефітів на цьому рівні</p>
            ) : (
              <ul className="text-foreground/75 flex flex-col gap-1.5 text-[14px]">
                {data.benefits.map((b, idx) => (
                  <li key={idx}>
                    {b.name || "(без назви)"}
                    {b.description ? <span className="text-muted-foreground"> — {b.description}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Overline>Призи (Поточний рівень)</Overline>
            {data.prizes.length === 0 ? (
              <p className="text-muted-foreground text-[14px]">Немає призів на цьому рівні</p>
            ) : (
              <ul className="text-foreground/75 flex flex-col gap-1.5 text-[14px]">
                {data.prizes.map((p, idx) => (
                  <li key={idx}>
                    {p.name || "(без назви)"}
                    {p.description ? <span className="text-muted-foreground"> — {p.description}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Overline>Доступні для отримання{unclaimed.length > 0 ? ` · ${unclaimed.length}` : ""}</Overline>
            {unclaimed.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {unclaimed.map((ul) => (
                  <div
                    key={ul.levelId}
                    className="flex items-center justify-between gap-4 border border-[rgba(201,158,58,.35)] bg-[rgba(201,158,58,.06)] px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold">{ul.levelName}</div>
                      <div className="text-foreground/55 mt-1 text-[13px]">{ul.prizesString}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleClaim(ul.levelId)}
                      disabled={claiming === ul.levelId}
                      className="cursor-pointer"
                    >
                      {claiming === ul.levelId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Видати
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-[14px]">Всі призи видано</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
