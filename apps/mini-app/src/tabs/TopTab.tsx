import { useEffect, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { useLeaderboard } from "@/context/LeaderboardContext"

const hatch = (opacity: number): React.CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(45deg, rgba(201,158,58,${opacity}) 0 2px, transparent 2px 9px)`,
})

export function TopTab() {
  const { items: sorted, isLoading, isLoadingMore, hasMore, loadFirstPage, loadMore } = useLeaderboard()

  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore()
    })
    if (node) observerRef.current.observe(node)
  }, [isLoadingMore, hasMore, loadMore])

  if (isLoading && sorted.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-guild-gold/50" />
      </div>
    )
  }

  const first = sorted[0]
  const second = sorted[1]
  const third = sorted[2]
  const rest = sorted.slice(3)

  return (
    <div className="flex flex-col pb-24">

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="px-4 mb-6 mt-2">
        <p className="font-mono text-[10px] tracking-[0.24em] text-guild-gold uppercase mb-2">
          Зала слави шукачів пригод
        </p>
        <h2 className="font-heading text-[28px] font-semibold uppercase tracking-wide text-guild-text">
          Таблиця лідерів
        </h2>
      </div>

      {/* ── Podium: three tower floors ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-6 items-end">

        {/* 2nd place */}
        {second ? (
          <div className="flex flex-col items-center gap-2 min-w-0">
            <p className={`text-[13px] font-semibold text-center truncate w-full ${second.isCurrentUser ? "text-guild-gold" : "text-guild-text"}`}>
              {second.isCurrentUser ? `${second.displayName} (Ви)` : second.displayName}
            </p>
            <p className="font-mono text-[11px] text-guild-text-muted text-center leading-tight">
              {second.pointsBalance.toLocaleString("uk-UA")}
              <span className="block text-[8px] tracking-tighter uppercase opacity-70">Досвіду</span>
            </p>
            <div
              style={hatch(0.1)}
              className="w-full h-[84px] border border-guild-gold/45 flex items-center justify-center"
            >
              <span className="font-heading text-3xl text-guild-text-muted">2</span>
            </div>
          </div>
        ) : <div />}

        {/* 1st place */}
        {first ? (
          <div className="flex flex-col items-center gap-2 z-10 min-w-0">
            <div className="relative w-[34px] h-[34px] flex items-center justify-center">
              <span className="absolute w-5 h-5 border-2 border-guild-gold rotate-45" />
              <span className="relative font-mono text-[11px] text-guild-gold">I</span>
            </div>
            <p className={`text-[15px] font-bold text-center truncate w-full ${first.isCurrentUser ? "text-guild-pure-gold" : "text-guild-text"}`}>
              {first.isCurrentUser ? `${first.displayName} (Ви)` : first.displayName}
            </p>
            <p className="font-mono text-xs text-guild-pure-gold text-center leading-tight">
              {first.pointsBalance.toLocaleString("uk-UA")}
              <span className="block text-[8px] tracking-tighter uppercase opacity-70">Досвіду</span>
            </p>
            <div className="w-full h-[126px] border-2 border-guild-gold bg-guild-gold text-guild-bg-bottom flex items-center justify-center">
              <span className="font-heading text-[44px] font-bold">1</span>
            </div>
          </div>
        ) : <div />}

        {/* 3rd place */}
        {third ? (
          <div className="flex flex-col items-center gap-2 min-w-0">
            <p className={`text-[13px] font-semibold text-center truncate w-full ${third.isCurrentUser ? "text-guild-gold" : "text-guild-text"}`}>
              {third.isCurrentUser ? `${third.displayName} (Ви)` : third.displayName}
            </p>
            <p className="font-mono text-[11px] text-guild-text-muted text-center leading-tight">
              {third.pointsBalance.toLocaleString("uk-UA")}
              <span className="block text-[8px] tracking-tighter uppercase opacity-70">Досвіду</span>
            </p>
            <div
              style={hatch(0.08)}
              className="w-full h-[62px] border border-guild-gold/32 flex items-center justify-center"
            >
              <span className="font-heading text-2xl text-guild-text-muted">3</span>
            </div>
          </div>
        ) : <div />}
      </div>

      {/* ── Leaderboard list (4th+) ───────────────────────────────────── */}
      <div className="flex flex-col px-4">
        {rest.map((entry, i) => {
          const isCurrentUser = entry.isCurrentUser
          const rank = i + 4

          return (
            <div
              key={entry.memberId}
              ref={i === rest.length - 1 ? loadMoreRef : null}
              className={`flex items-center gap-3.5 py-3.5 pr-3 border-b border-guild-gold/12 ${isCurrentUser ? "bg-guild-card border-l-2 border-l-guild-gold pl-3" : "pl-1"
                }`}
            >
              <span className={`font-mono text-[13px] w-6 shrink-0 ${isCurrentUser ? "text-guild-gold" : "text-guild-text-muted"}`}>
                {rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] font-semibold truncate ${isCurrentUser ? "text-guild-pure-gold" : "text-guild-text"}`}>
                  {isCurrentUser ? `Ви (${entry.displayName})` : entry.displayName}
                </p>
                <p className="font-mono text-[10px] text-guild-text-dim uppercase tracking-wide mt-1">
                  {entry.levelName}
                </p>
              </div>
              <span className={`font-mono text-sm font-bold shrink-0 ${isCurrentUser ? "text-guild-pure-gold" : "text-guild-text"}`}>
                {entry.pointsBalance.toLocaleString("uk-UA")}
              </span>
            </div>
          )
        })}

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-guild-gold/50" />
          </div>
        )}
      </div>
    </div>
  )
}
