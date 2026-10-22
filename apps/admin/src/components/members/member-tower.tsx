import { cn } from "@/lib/utils"
import { useLevels } from "@/hooks/use-levels"
import { Overline, overlineMutedClass } from "@/components/ui/typography"

interface MemberTowerProps {
    levelId?: string
    pointsBalance: number
}

/**
 * The same primitive the Mini App shows the player: one floor per level,
 * current floor bright, completed floors filled, locked floors a hairline.
 * Admin variant is compact — bars plus the level readout, no accordion.
 */
export function MemberTower({ levelId, pointsBalance }: MemberTowerProps) {
    const { levels, isLoading, getProgress } = useLevels()
    const { level, ordinal, nextLevel, pointsToNext, progress } = getProgress(levelId, pointsBalance)

    if (isLoading && levels.length === 0) {
        return (
            <div className="border-hairline flex h-[220px] max-w-[460px] items-center justify-center border p-5">
                <span className={overlineMutedClass}>Завантаження…</span>
            </div>
        )
    }

    if (levels.length === 0) return null

    const currentIndex = (ordinal ?? 1) - 1

    return (
        <div className="border-hairline max-w-[460px] border p-5">
            <Overline className="mb-4">Вежа підкорювача</Overline>

            <div className="flex items-end gap-[18px]">
                {/* Floors run bottom-up: level 1 at the base. */}
                <div className="flex flex-1 flex-col-reverse gap-1">
                    {levels.map((floor, index) => {
                        const isCurrent = index === currentIndex
                        const isCompleted = index < currentIndex

                        return (
                            <div key={floor.levelId} className="flex items-center gap-2.5" title={floor.name}>
                                <span className="text-foreground/35 w-4 font-mono text-[10px]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span
                                    className="h-3.5 flex-1 border"
                                    style={{
                                        background: isCurrent
                                            ? "var(--accent-bright)"
                                            : isCompleted
                                                ? "rgba(201,158,58,.7)"
                                                : "transparent",
                                        borderColor: isCurrent || isCompleted ? "transparent" : "rgba(237,230,216,.12)",
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* The name is what the admin recognises; the ordinal qualifies it. */}
                <div className="min-w-0 max-w-[48%] text-right">
                    <div className="text-accent-bright font-heading text-[26px] leading-[1.05] font-semibold uppercase tracking-[.03em]">
                        {level?.name ?? "—"}
                    </div>
                    <div className={cn(overlineMutedClass, "mt-2.5")}>
                        Рівень <span className="text-foreground/70 ml-1 font-mono">{ordinal ?? "—"}</span>
                    </div>
                </div>
            </div>

            {/* Numbers stay mono; the words around them do not. */}
            <div className="text-foreground/60 mt-[18px] flex justify-between gap-4 text-[13px]">
                <span className="font-mono">{pointsBalance.toLocaleString("uk-UA")} XP</span>
                {nextLevel && pointsToNext !== undefined ? (
                    <span className="truncate">
                        до {nextLevel.name} — <span className="text-accent-bright font-mono">{pointsToNext.toLocaleString("uk-UA")}</span>
                    </span>
                ) : (
                    <span>максимальний рівень</span>
                )}
            </div>
            <div className="mt-2 h-1 bg-[rgba(237,230,216,.12)]">
                <div className="bg-primary h-1" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
        </div>
    )
}
