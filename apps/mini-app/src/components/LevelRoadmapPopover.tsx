import { useState, useEffect } from "react"
import { Check, Lock, Star, Zap, Sparkles, Gift, Award, Tag, ArrowLeft } from "lucide-react"
import { useMember } from "@/hooks/useMember"
import { useLevels } from "@/hooks/useLevels"

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

    // Auto-expand next level initially, or current level if max
    useEffect(() => {
        if (isOpen && !expandedId) {
            if (nextLevel) setExpandedId(nextLevel.levelId);
            else setExpandedId(currentLevel.levelId);
        }
    }, [isOpen, nextLevel, currentLevel, expandedId]);

    const safeTop = "calc(max(env(safe-area-inset-top), env(safe-area-inset-top) + 3rem)";

    return (
        <>
            <div
                className={`fixed inset-0 z-[60] bg-[#011711] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <header
                    className="fixed top-0 left-0 w-full z-10 flex items-center px-6 pb-4 bg-[#011711] shadow-[0px_8px_32px_rgba(0,17,12,0.4)]"
                    style={{ paddingTop: safeTop }}
                >
                    <button onClick={onClose} className="active:scale-95 transition-transform text-[#e5c192] mr-4">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-manrope text-xl font-bold tracking-tight text-white">Ранги Гільдії</h1>
                </header>

                <main
                    className="h-full px-6 max-w-2xl mx-auto overflow-y-auto space-y-8 no-scrollbar touch-pan-y pb-8"
                    style={{ paddingTop: `calc(${safeTop} + 4rem)` }}
                >

                    <section className="space-y-4">
                        <div className="glass-card rounded-xl p-6 ring-1 ring-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <span className="text-xs uppercase tracking-[0.2em] text-[#a6cfbf] font-bold">Поточний рівень</span>
                                    <h2 className="text-2xl font-extrabold text-[#e5c192] tracking-tight mt-1">{currentLevel.name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-guild-gold mt-1">{member.pointsBalance} Досвіду</p>
                                </div>
                            </div>

                            {nextLevel && (
                                <div className="mt-8 space-y-2 relative z-10">
                                    <div className="flex justify-between text-[11px] font-bold text-[#a6cfbf]/80 uppercase tracking-wider">
                                        <span>Прогрес до "{nextLevel.name}"</span>
                                        <span>{Math.round(progressClamped)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#172e27] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-[#c76e1b] to-[#ffb781] rounded-full shadow-[0_0_12px_rgba(255,183,129,0.3)]"
                                            style={{ width: `${progressClamped}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="space-y-3 pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#a6cfbf]">Ієрархія Рангів</h3>
                            <span className="text-xs text-[#e5c192] font-bold uppercase tracking-widest">{levels.length} Ступенів</span>
                        </div>

                        {levels.map((lvl: any, idx: number) => {
                            const status = idx < currentIdx ? "COMPLETED" : idx === currentIdx ? "CURRENT" : "LOCKED";
                            const isExpanded = expandedId === lvl.levelId;

                            return (
                                <div key={lvl.levelId} className={`flex items-start gap-4 group ${status === 'LOCKED' ? (isExpanded ? '' : 'opacity-60') : ''}`}>
                                    <div className="flex flex-col items-center mt-1">
                                        {status === 'COMPLETED' && (
                                            <>
                                                <div className="w-8 h-8 rounded-full border-2 border-[#a6cfbf]/30 flex items-center justify-center bg-[#172e27]">
                                                    <Check className="w-4 h-4 text-[#a6cfbf]" strokeWidth={3} />
                                                </div>
                                                <div className="w-0.5 h-6 bg-[#a6cfbf]/20"></div>
                                            </>
                                        )}
                                        {status === 'CURRENT' && (
                                            <>
                                                <div className="w-8 h-8 rounded-full border-2 border-[#e5c192] flex items-center justify-center bg-[#2b1900] shadow-[0_0_15px_rgba(229,193,146,0.2)]">
                                                    <Zap className="w-4 h-4 text-[#e5c192] fill-current" />
                                                </div>
                                                {idx < levels.length - 1 && <div className="w-0.5 h-full min-h-[32px] bg-[#e5c192]/40"></div>}
                                            </>
                                        )}
                                        {status === 'LOCKED' && (
                                            <>
                                                <div className="w-8 h-8 rounded-full border-2 border-[#223932] flex items-center justify-center bg-[#072019]">
                                                    <Lock className="w-3.5 h-3.5 text-[#a6cfbf]/40" />
                                                </div>
                                                {idx < levels.length - 1 && <div className="w-0.5 h-full min-h-[24px] bg-[#223932]/40"></div>}
                                            </>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : lvl.levelId)}
                                        className={`flex-1 glass-card cursor-pointer overflow-hidden
                                    ${status === 'CURRENT' ? 'border border-[#e5c192]/30 shadow-lg' : ''}
                                `}
                                    >
                                        <div className="p-4 flex flex-col">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold tracking-wide ${isExpanded ? 'text-xl' : 'text-sm'} ${status === 'CURRENT' || isExpanded ? 'text-white' : 'text-white/80'} transition-all`}>
                                                        {lvl.name}
                                                    </span>
                                                    {status === 'CURRENT' && !isExpanded && (
                                                        <span className="px-2 py-0.5 rounded-full bg-[#e5c192] text-[#291800] text-[9px] font-black uppercase tracking-tighter">
                                                            Ваш рівень
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-bold ${status === 'COMPLETED' ? 'text-[#a6cfbf]' : 'text-[#ffb781]'}`}>
                                                    {status === 'COMPLETED' ? 'ПРОЙДЕНО' : `${lvl.minPoints} ДОСВІДУ`}
                                                </span>
                                            </div>

                                            <div
                                                className="transition-all duration-500 ease-in-out overflow-hidden transform-gpu"
                                                style={{
                                                    maxHeight: isExpanded ? '500px' : '0px',
                                                    opacity: isExpanded ? 1 : 0,
                                                    marginTop: isExpanded ? '1.5rem' : '0px'
                                                }}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className="space-y-6 pb-2">

                                                        {lvl.benefits && lvl.benefits.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Sparkles className="w-5 h-5 text-[#e5c192]" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6cfbf]">Переваги</span>
                                                                </div>
                                                                <ul className="space-y-2 pl-2">
                                                                    {lvl.benefits.map((b: any, bIdx: number) => (
                                                                        <li key={bIdx} className="flex items-start gap-3 text-sm">
                                                                            <div className="w-1 h-1 rounded-full bg-[#e5c192] mt-2 shrink-0"></div>
                                                                            <span>{b.name}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {lvl.prizes && lvl.prizes.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Gift className="w-5 h-5 text-[#e5c192] shrink-0" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6cfbf]">Призи</span>
                                                                </div>
                                                                <div className="grid">
                                                                    {lvl.prizes.map((p: any, pIdx: number) => (
                                                                        <div key={pIdx} className="bg-surface-container-high/40 p-3 rounded-lg flex items-center gap-3">
                                                                            <Award className="w-4 h-4 text-[#ffb781] shrink-0" />
                                                                            <span className="text-sm leading-tight">{p.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {lvl.promotions && lvl.promotions.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag className="w-5 h-5 text-[#e5c192] shrink-0" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6cfbf]">Знижки</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {lvl.promotions.map((promo: any, prIdx: number) => (
                                                                        <div key={prIdx} className="bg-[#00110c]/60 rounded-xl p-4 flex justify-between items-center gap-4">
                                                                            <span className="text-sm flex-1">{promo.name}</span>
                                                                            <span className="text-lg font-black text-[#e5c192]">
                                                                                {formatPromoDiscountText(promo)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {(!lvl.benefits?.length && !lvl.prizes?.length && !lvl.promotions?.length) && (
                                                            <div className="text-xs text-white/50 text-center py-4">Немає додаткових переваг на цьому рівні</div>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </section>
                </main>
            </div>
        </>
    )
}
