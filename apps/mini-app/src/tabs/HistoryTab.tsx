import { useRef, useEffect, useContext } from "react"
import { useHistory, type HistoryEntry } from "@/context/HistoryContext"
import { MemberContext } from "@/context/MemberContext"
import { LevelContext } from "@/context/LevelContext"
import { CategoryIcon } from "@/components/CategoryIcon"
import { isDonationNote } from "@/lib/donation"

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
  // Donations may be linked to an event, so they must be recognised before activities.
  if (isDonationNote(entry.adminNote)) return "Донат"
  if (entry.activity?.hasGame || entry.game) return "Сесія НРІ"
  if (entry.activity) return "Активність"
  if (entry.product) return "Крамниця Вежі"
  if (entry.promo) return "Промо-акція"
  if (entry.adminNote && entry.delta < 0) return "Штраф"
  if (entry.adminNote) return "Адмін"
  return "Інше"
}

function getEntryTitle(entry: HistoryEntry): string {
  if (isDonationNote(entry.adminNote)) {
    return entry.activity ? `${entry.adminNote} · ${entry.activity.name}` : entry.adminNote
  }
  if (entry.activity) {
    const gameName = entry.game?.name ? ` (${entry.game.name})` : ""
    return `${entry.activity.name}${gameName}`
  }
  if (entry.product) return entry.product.name
  if (entry.promo) return entry.promo.name
  if (entry.adminNote) return entry.adminNote
  return "Не вказано"
}

function getCategoryIcon(entry: HistoryEntry) {
  if (isDonationNote(entry.adminNote))
    return <CategoryIcon shape="diamond" glyph="₴" className="text-guild-gold" />
  if (entry.game || entry.activity?.hasGame)
    return <CategoryIcon shape="hex" glyph="20" className="text-guild-gold" />
  if (entry.activity)
    return <CategoryIcon shape="hex" glyph="XP" className="text-guild-gold" />
  if (entry.product)
    return <CategoryIcon shape="square" glyph="₴" className="text-guild-gold" />
  if (entry.promo)
    return <CategoryIcon shape="square" glyph="%" className="text-guild-gold" />
  if (entry.adminNote)
    return <CategoryIcon shape="triangle" glyph="!" className="text-guild-text-muted" />
  return <CategoryIcon shape="square" glyph="?" className="text-guild-text-muted" />
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
        <p className="font-mono text-[10px] tracking-[0.24em] text-guild-gold uppercase mb-2">
          Артефакт Пам'яті
        </p>
        <h2 className="font-heading text-[28px] font-semibold uppercase tracking-wide text-guild-text">
          Історія досвіду
        </h2>
        <p className="text-guild-text-muted text-sm mt-2">
          Ваш шлях крізь пригоди та випробування у Вежі.
        </p>
      </div>

      {/* ── XP Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-[2px] bg-guild-card-border mb-8">
        <div className="bg-guild-modal-bg p-4">
          <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block">
            Рівень
          </span>
          <span className="font-heading text-lg uppercase tracking-wide text-guild-text leading-tight min-w-0 block mt-2">
            {memberCtx?.isLoading ? (
              <span className="inline-block w-20 h-5 bg-white/10 animate-pulse" />
            ) : levelName}
          </span>
        </div>
        <div className="bg-guild-modal-bg p-4">
          <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block">
            Усього зароблено досвіду
          </span>
          <span className="font-mono text-xl font-bold text-guild-pure-gold leading-tight min-w-0 block mt-1.5">
            {memberCtx?.isLoading ? (
              <span className="inline-block w-20 h-5 bg-white/10 animate-pulse" />
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
        <div className="border border-guild-card-border p-6 text-center">
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
              <div className="flex items-center gap-3 mb-2.5">
                <h3
                  className={`font-mono text-[10px] tracking-[0.2em] uppercase shrink-0 ${group.label === "Сьогодні"
                    ? "text-guild-gold"
                    : "text-guild-text-muted"
                    }`}
                >
                  {group.label}
                </h3>
                <div className="h-px flex-grow bg-guild-card-border" />
              </div>

              {/* Entries */}
              <div className="flex flex-col">
                {group.entries.map((entry, i) => (
                  <div
                    key={entry.entryId || i}
                    className="flex items-center gap-3 py-2.5 border-b border-guild-gold/10"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(entry)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-guild-text truncate leading-tight">
                        {getEntryTitle(entry)}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-guild-text-muted mt-1">
                        {formatTime(entry.occurredAt)} · {getCategoryLabel(entry)}
                      </p>
                    </div>

                    {/* Delta */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`font-mono text-sm font-bold ${entry.delta > 0
                          ? "text-guild-positive"
                          : entry.delta < 0
                            ? "text-guild-negative"
                            : "text-guild-text-muted"
                          }`}
                      >
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </span>
                      <p className="font-mono text-[9px] text-guild-text-dim font-bold uppercase">
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
