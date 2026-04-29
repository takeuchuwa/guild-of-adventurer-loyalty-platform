import { useRef, useEffect, useContext } from "react"
import { Dice5, ShoppingBag, Tag, Wrench, FileText, BowArrow } from "lucide-react"
import { useHistory, type HistoryEntry } from "@/context/HistoryContext"
import { MemberContext } from "@/context/MemberContext"
import { LevelContext } from "@/context/LevelContext"

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDayLabel(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayMidnight = new Date(todayMidnight.getTime() - 86400000)
  const entryMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (entryMidnight.getTime() === todayMidnight.getTime()) return "Сьогодні"
  if (entryMidnight.getTime() === yesterdayMidnight.getTime()) return "Вчора"

  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    timeZone: "Europe/Kyiv",
  })
}

function getDayKey(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  })
}

function getCategoryLabel(entry: HistoryEntry): string {
  if (entry.activity?.hasGame || entry.game) return "Сесія НРІ"
  if (entry.activity) return "Активність"
  if (entry.product) return "Крамниця Гільдії"
  if (entry.promo) return "Промо-акція"
  if (entry.adminNote && entry.delta < 0) return "Штраф"
  if (entry.adminNote) return "Адмін"
  return "Інше"
}

function getEntryTitle(entry: HistoryEntry): string {
  if (entry.activity) {
    const gameName = entry.game?.name ? ` (${entry.game.name})` : ""
    return `${entry.activity.name}${gameName}`
  }
  if (entry.product) return entry.product.name
  if (entry.promo) return entry.promo.name
  if (entry.adminNote) return entry.adminNote
  return "Не вказано"
}

function getReasonIcon(entry: HistoryEntry) {
  if (entry.game || entry.activity?.hasGame)
    return <Dice5 className="w-5 h-5 text-guild-gold" />
  if (entry.activity)
    return <BowArrow className="w-5 h-5 text-guild-green-light" />
  if (entry.product)
    return <ShoppingBag className="w-5 h-5 text-guild-green-light" />
  if (entry.promo)
    return <Tag className="w-5 h-5 text-guild-pure-gold" />
  if (entry.adminNote)
    return <Wrench className="w-5 h-5 text-guild-text-muted" />
  return <FileText className="w-5 h-5 text-guild-text-muted" />
}

// ─── Group by day ────────────────────────────────────────────────────────────

interface DayGroup {
  key: string
  label: string
  entries: HistoryEntry[]
}

function groupByDay(items: HistoryEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>()
  for (const entry of items) {
    const key = getDayKey(entry.occurredAt)
    if (!map.has(key)) {
      map.set(key, { key, label: getDayLabel(entry.occurredAt), entries: [] })
    }
    map.get(key)!.entries.push(entry)
  }
  return Array.from(map.values())
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HistoryTab() {
  const { items, hasMore, isLoading, isLoadingMore, loadFirstPage, loadMore } = useHistory()
  const memberCtx = useContext(MemberContext)
  const levelCtx = useContext(LevelContext)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  useEffect(() => {
    if (!hasMore || !observerRef.current || isLoading || isLoadingMore) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore, isLoading, isLoadingMore])

  // Resolve current level name
  const member = memberCtx?.member ?? null
  const levels = levelCtx?.levels ?? []
  const currentLevel = levels.find((l) => l.levelId === member?.levelId)
  const levelName = currentLevel?.name ?? "—"
  const totalXp = member?.pointsBalance != null
    ? member.pointsBalance.toLocaleString("uk-UA")
    : "—"

  const dayGroups = groupByDay(items)

  return (
    <div className="flex flex-col px-4 pb-24">

      {/* ── Hero / Subtitle ───────────────────────────────────────────── */}
      <div className="mb-6 mt-2">
        <p className="text-[0.6875rem] font-bold tracking-[0.2em] text-guild-gold/60 uppercase mb-1">
          Артефакт Пам'яті
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-guild-text">
          Історія досвіду
        </h2>
        <p className="text-guild-text-muted text-sm mt-1">
          Ваш шлях крізь пригоди та випробування Гільдії.
        </p>
      </div>

      {/* ── XP Summary Bento Cards ───────────────────────────────────── */}
      <div className="grid gap-3 mb-8">
        <div className="glass-card p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-guild-text-muted uppercase tracking-wider">
            Рівень
          </span>
          <span className="text-xl font-bold text-guild-gold leading-tight min-w-0">
            {memberCtx?.isLoading ? (
              <span className="inline-block w-20 h-5 bg-white/10 rounded animate-pulse" />
            ) : levelName}
          </span>
        </div>
        <div className="glass-card p-5 flex flex-col justify-between gap-3">
          <span className="text-xs font-semibold text-guild-text-muted uppercase tracking-wider">
            Усього зароблено досвіду
          </span>
          <span className="text-xl font-bold text-guild-orange leading-tight min-w-0">
            {memberCtx?.isLoading ? (
              <span className="inline-block w-20 h-5 bg-white/10 rounded animate-pulse" />
            ) : totalXp}
          </span>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      {isLoading && items.length === 0 ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-guild-gold/30 border-t-guild-gold rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-guild-text-muted">Історія досвіду порожня</p>
          <p className="text-xs text-guild-text-dim mt-1">
            Починайте грати в ігри та купувати товари!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dayGroups.map((group) => (
            <section key={group.key}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <h3
                  className={`text-xs font-bold tracking-widest uppercase shrink-0 ${group.label === "Сьогодні"
                    ? "text-guild-gold"
                    : "text-guild-text-muted"
                    }`}
                >
                  {group.label}
                </h3>
                <div className="h-px flex-grow bg-guild-divider" />
              </div>

              {/* Entries */}
              <div className="flex flex-col gap-2">
                {group.entries.map((entry, i) => (
                  <div
                    key={entry.entryId || i}
                    className="glass-card p-4 flex items-center gap-4"
                  >
                    {/* Icon container */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      {getReasonIcon(entry)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-guild-text truncate">
                        {getEntryTitle(entry)}
                      </p>
                      <p className="text-[11px] text-guild-text-muted mt-0.5">
                        {formatTime(entry.occurredAt)} • {getCategoryLabel(entry)}
                      </p>
                    </div>

                    {/* Delta */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`text-sm font-bold ${entry.delta > 0
                          ? "text-guild-positive"
                          : entry.delta < 0
                            ? "text-guild-negative"
                            : "text-guild-text-muted"
                          }`}
                      >
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </span>
                      <p className="text-[10px] text-guild-text-dim font-bold uppercase">
                        досвіду
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={observerRef} className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-guild-gold/30 border-t-guild-gold rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
