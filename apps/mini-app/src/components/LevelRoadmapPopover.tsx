import { useState, useEffect } from "react"
import { useMember } from "@/hooks/useMember"
import { useLevels } from "@/hooks/useLevels"
import { Tower, type TowerFloor } from "@/components/Tower"

function formatPromoDiscountText(promo: any) {
    if (!promo || !promo.config) return "";
    const p = promo.config.effects?.price;
    if (p) {
        if (p.type === "percentage") return `-${p.value}%`;
        if (p.type === "fixed") return `-${p.value}₴`;
    }
    return "Знижка";
}

interface LevelRoadmapPopoverProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LevelRoadmapPopover({ isOpen, onClose }: LevelRoadmapPopoverProps) {
    const { member } = useMember()
    const { levels } = useLevels()

    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen])

    if (!member || !levels.length) return null

    const currentIdx = levels.findIndex((l: any) => l.levelId === member.levelId) >= 0 ? levels.findIndex((l: any) => l.levelId === member.levelId) : 0;
    const currentLevel = levels[currentIdx];
    const nextLevel = currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null;

    const progress = nextLevel
        ? ((member.pointsBalance - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
        : 100
    const progressClamped = Math.min(Math.max(progress, 0), 100)

    // Auto-select next level initially, or current level if max
    useEffect(() => {
        if (isOpen && !expandedId) {
            if (nextLevel) setExpandedId(nextLevel.levelId);
            else setExpandedId(currentLevel.levelId);
        }
    }, [isOpen, nextLevel, currentLevel, expandedId]);

    const safeTop = "calc(max(env(safe-area-inset-top), env(safe-area-inset-top) + 3rem)";

    const towerFloors: TowerFloor[] = levels.map((lvl: any, idx: number) => ({
        id: lvl.levelId,
        name: lvl.name,
        minPoints: lvl.minPoints,
        status: idx < currentIdx ? "completed" : idx === currentIdx ? "current" : "locked",
        fillPercent: idx === currentIdx ? progressClamped : undefined,
    }))

    const renderFloorDetails = (floor: TowerFloor) => {
        const lvl = levels.find((l: any) => l.levelId === floor.id)
        if (!lvl) return null
        const hasBenefits = lvl.benefits && lvl.benefits.length > 0
        const hasPrizes = lvl.prizes && lvl.prizes.length > 0
        const hasPromotions = lvl.promotions && lvl.promotions.length > 0

        return (
            <div>
                {hasBenefits && (
                    <div className="border-t border-guild-gold/20 px-3.5 py-3">
                        <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block mb-2">Переваги</span>
                        <ul className="space-y-1.5">
                            {lvl.benefits.map((b: any, bIdx: number) => (
                                <li key={bIdx} className="flex items-start gap-2.5 text-sm text-guild-text/90 leading-tight">
                                    <span className="w-2 h-2 bg-guild-gold rotate-45 mt-[3px] shrink-0" />
                                    <span>{b.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {hasPrizes && (
                    <div className="border-t border-guild-gold/20 px-3.5 py-3">
                        <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block mb-2">Призи</span>
                        <ul className="space-y-1.5">
                            {lvl.prizes.map((p: any, pIdx: number) => (
                                <li key={pIdx} className="flex items-start gap-2.5 text-sm text-guild-text/90 leading-tight">
                                    <span className="w-2 h-2 bg-guild-gold rotate-45 mt-[3px] shrink-0" />
                                    <span>{p.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {hasPromotions && (
                    <div className="border-t border-guild-gold/20 px-3.5 py-3">
                        <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block mb-2">Знижки</span>
                        <ul className="space-y-1.5">
                            {lvl.promotions.map((promo: any, prIdx: number) => (
                                <li key={prIdx} className="flex items-start gap-2.5 text-sm text-guild-text/90 leading-tight">
                                    <span className="w-2 h-2 bg-guild-gold rotate-45 mt-[3px] shrink-0" />
                                    <span className="flex-1">{promo.name}</span>
                                    <span className="font-mono text-xs font-bold text-guild-pure-gold shrink-0">
                                        {formatPromoDiscountText(promo)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!hasBenefits && !hasPrizes && !hasPromotions && (
                    <div className="border-t border-guild-gold/20 px-3.5 py-4 font-mono text-xs text-guild-text-dim text-center">
                        Немає додаткових переваг на цьому рівні
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            <div
                className={`fixed inset-0 z-[60] bg-guild-bg-bottom transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <header
                    className="fixed top-0 left-0 w-full z-10 flex items-center gap-3.5 px-6 pb-4 bg-guild-bg-bottom border-b border-guild-card-border"
                    style={{ paddingTop: safeTop }}
                >
                    <button
                        onClick={onClose}
                        className="w-9 h-9 shrink-0 flex items-center justify-center border border-guild-gold/40 font-mono text-guild-gold text-sm active:bg-guild-gold active:text-guild-bg-bottom transition-colors"
                        aria-label="Назад"
                    >
                        ←
                    </button>
                    <h1 className="font-heading text-xl uppercase tracking-wide text-guild-text">Ранги Вежі</h1>
                </header>

                <main
                    className="h-full px-6 max-w-2xl mx-auto overflow-y-auto space-y-6 no-scrollbar touch-pan-y pb-10"
                    style={{ paddingTop: `calc(${safeTop} + 4rem)` }}
                >

                    {/* Current level summary */}
                    <div className="border border-guild-gold/30 p-4 flex justify-between items-center">
                        <div>
                            <span className="font-mono text-[10px] tracking-[0.24em] text-guild-gold uppercase">Поточний рівень</span>
                            <h2 className="font-heading text-xl uppercase tracking-wide text-guild-text mt-1.5">{currentLevel.name}</h2>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg font-bold text-guild-pure-gold">{member.pointsBalance.toLocaleString("uk-UA")}</p>
                            <p className="font-mono text-[10px] tracking-wider text-guild-text-muted uppercase mt-0.5">Досвіду</p>
                        </div>
                    </div>

                    {/* Full tower */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] tracking-[0.2em] text-guild-gold uppercase">Ієрархія рангів</span>
                            <span className="font-mono text-[10px] tracking-wider text-guild-text-muted uppercase">{levels.length} Ступенів</span>
                        </div>

                        <Tower
                            floors={towerFloors}
                            selectedId={expandedId ?? undefined}
                            onFloorClick={(id) => setExpandedId((current) => (current === id ? null : id))}
                            renderExpanded={renderFloorDetails}
                        />

                        <p className="font-mono text-[10px] tracking-wider text-guild-text-dim uppercase text-center pt-2">
                            Тап по поверху — переваги, призи, знижки
                        </p>
                    </section>
                </main>
            </div>
        </>
    )
}
