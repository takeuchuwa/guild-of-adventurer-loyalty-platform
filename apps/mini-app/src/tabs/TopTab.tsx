import { useEffect, useRef, useCallback } from "react"
import { Trophy, Loader2, CircleStar } from "lucide-react"
import { useLeaderboard } from "@/context/LeaderboardContext"

// Avatar placeholder — no photo, just initials or generic icon
function Avatar({ displayName, size = "md", gold = false }: { displayName: string; size?: "sm" | "md" | "lg"; gold?: boolean }) {
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const sizeClass = size === "lg" ? "w-20 h-20 text-xl" : size === "md" ? "w-14 h-14 text-base" : "w-10 h-10 text-xs"
  const borderClass = gold
    ? "border-4 border-guild-gold"
    : "border-2 border-guild-card-border"

  return (
    <div
      className={`${sizeClass} ${borderClass} rounded-full bg-guild-card flex items-center justify-center font-bold text-guild-text-muted shrink-0`}
    >
      {initials || "?"}
    </div>
  )
}

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
      <div className="text-center px-4 mb-8 mt-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-guild-text">
          Таблиця лідерів
        </h2>
        <p className="text-[11px] font-bold tracking-[0.2em] text-guild-text-muted uppercase mt-1">
          Зала слави шукачів пригод
        </p>
      </div>

      {/* ── Podium ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4 items-end">

        {/* 2nd place */}
        {second ? (
          <div className="flex flex-col items-center min-w-0">
            {/* Rank badge */}
            {/* Name - allow wrapping but limit to 2 lines to keep consistent height */}
            <div className="h-10 flex items-center justify-center px-1 w-full overflow-hidden">
              <p className={`text-[10px] sm:text-xs font-bold text-center leading-tight line-clamp-2 ${second.isCurrentUser ? "text-guild-gold" : "text-guild-text"}`}>
                {second.isCurrentUser ? `${second.displayName} (Ви)` : second.displayName}
              </p>
            </div>
            <div className="w-full h-24 bg-guild-card rounded-t-xl flex flex-col items-center justify-end pb-3">
              <span className={`text-2xl font-black relative ${second.isCurrentUser ? "text-guild-gold" : "text-guild-text-muted"}`}>2</span>
              <p className="text-xs text-guild-text-muted font-black flex flex-col items-center leading-none pt-4">
                {second.pointsBalance.toLocaleString("uk-UA")}
                <span className="text-[9px] opacity-60 font-bold uppercase mt-0.5 tracking-tighter">Досвіду</span>
              </p>
            </div>
          </div>
        ) : <div />}

        {/* 1st place */}
        {first ? (
          <div className="flex flex-col items-center z-10 min-w-0">
            {/* Trophy icon */}
            <Trophy className="w-6 h-6 text-guild-gold shrink-0" />
            <div className="h-10 flex items-center justify-center mb-2 px-1 w-full overflow-hidden">
              <p className={`text-xs sm:text-sm font-black text-center leading-tight line-clamp-2 ${first.isCurrentUser ? "text-guild-gold" : "text-guild-text"}`}>
                {first.isCurrentUser ? `${first.displayName} (Ви)` : first.displayName}
              </p>
            </div>
            {/* Tallest platform */}
            <div
              className="w-full h-36 rounded-t-2xl flex flex-col items-center justify-end pb-4 relative overflow-hidden shadow-[0_0_20px_rgba(200,166,121,0.1)]"
              style={{ background: "rgba(40,78,65,0.7)" }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-guild-gold/20 to-transparent" />
              <span className="text-3xl font-black text-guild-gold relative">1</span>
              <p className="text-sm text-guild-text-muted font-black relative flex flex-col items-center leading-none pt-6">
                {first.pointsBalance.toLocaleString("uk-UA")}
                <span className="text-[10px] opacity-70 font-bold uppercase mt-0.5 tracking-tighter">Досвіду</span>
              </p>
            </div>
          </div>
        ) : <div />}

        {/* 3rd place */}
        {third ? (
          <div className="flex flex-col items-center min-w-0">
            <div className="h-10 flex items-center justify-center px-1 w-full overflow-hidden">
              <p className={`text-[10px] sm:text-xs font-bold text-center leading-tight line-clamp-2 ${third.isCurrentUser ? "text-guild-gold" : "text-guild-text"}`}>
                {third.isCurrentUser ? `${third.displayName} (Ви)` : third.displayName}
              </p>
            </div>
            <div className="w-full h-20 bg-guild-card rounded-t-xl flex flex-col items-center justify-end pb-3">
              <span className={`text-xl font-black relative ${third.isCurrentUser ? "text-guild-gold" : "text-guild-text-muted"}`}>3</span>
              <p className="text-xs text-guild-text-muted font-black flex flex-col items-center leading-none pt-2">
                {third.pointsBalance.toLocaleString("uk-UA")}
                <span className="text-[9px] opacity-60 font-bold uppercase mt-0.5 tracking-tighter">Досвіду</span>
              </p>
            </div>
          </div>
        ) : <div />}
      </div>

      {/* ── Leaderboard list (4th+) ───────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 px-4">
        {rest.map((entry, i) => {
          const isCurrentUser = entry.isCurrentUser
          const rank = i + 4

          if (isCurrentUser) {
            // Current user — highlighted card
            return (
              <div
                key={entry.memberId}
                ref={i === rest.length - 1 ? loadMoreRef : null}
                className="glass-card p-4 rounded-xl flex items-center justify-between"
                style={{
                  background: "rgba(40,78,65,0.8)",
                  boxShadow: "0 0 20px rgba(200,166,121,0.1)",
                  outline: "1px solid rgba(200,166,121,0.2)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-guild-gold flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-guild-bg-bottom">{rank}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-guild-gold truncate">
                      Ви <span className="text-[10px] text-guild-orange font-medium ml-1">({entry.displayName})</span>
                    </p>
                    <p className="text-[10px] text-guild-text-muted uppercase font-bold tracking-wide">
                      {entry.levelName}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-guild-gold">{entry.pointsBalance.toLocaleString("uk-UA")}</p>
                  <p className="text-[9px] text-guild-text-muted uppercase font-bold tracking-tighter opacity-60">Досвіду</p>
                </div>
              </div>
            )
          }

          return (
            <div
              key={entry.memberId}
              ref={i === rest.length - 1 ? loadMoreRef : null}
              className="glass-card p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-guild-text-muted">{rank}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-guild-text truncate">{entry.displayName}</p>
                  <p className="text-[10px] text-guild-text-muted uppercase font-semibold tracking-wide">
                    {entry.levelName}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-guild-text">{entry.pointsBalance.toLocaleString("uk-UA")}</p>
                <p className="text-[9px] text-guild-text-muted/75 uppercase font-bold tracking-tighter">Досвіду</p>
              </div>
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
