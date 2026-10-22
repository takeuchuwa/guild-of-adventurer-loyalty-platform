import { useState, useEffect } from "react"
import { QrCodeDisplay } from "@/components/QrCodeDisplay"
import { Tower, type TowerFloor } from "@/components/Tower"
import { CategoryIcon } from "@/components/CategoryIcon"
import { useMember } from "@/hooks/useMember"
import { useLevels } from "@/hooks/useLevels"
import { SettingsModal } from "@/components/SettingsModal"
import { EditProfileModal } from "@/components/EditProfileModal"
import { LevelRoadmapPopover } from "@/components/LevelRoadmapPopover"

// Small outline ticket + stub glyph for promo rows (22x14 slot).
function TicketIcon({ className = "" }: { className?: string }) {
  return (
    <span
      className={`w-[22px] h-[14px] shrink-0 border-2 border-guild-gold box-border flex items-center justify-end pr-[5px] ${className}`}
    >
      <span className="w-[2px] h-[8px] bg-guild-gold block" />
    </span>
  )
}

// Copy-able promo code row: tap copies the code and flips to a 120ms color
// inversion, showing "СКОПІЙОВАНО" for ~1.2s.
function CopyCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // clipboard unavailable — still show feedback
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      onClick={handleCopy}
      className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase bg-guild-text text-guild-bg-bottom px-2.5 py-1.5 shrink-0 transition-colors"
    >
      {copied ? "Скопійовано" : code}
    </button>
  )
}

function getPrizeWord(count: number): string {
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 >= 11 && mod100 <= 19) return "винагород"
  if (mod10 === 1) return "винагорода"
  if (mod10 >= 2 && mod10 <= 4) return "винагороди"
  return "винагород"
}

function getDiscountWord(count: number): string {
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 >= 11 && mod100 <= 19) return "знижок"
  if (mod10 === 1) return "знижка"
  if (mod10 >= 2 && mod10 <= 4) return "знижки"
  return "знижок"
}

function formatPromoData(promo: any, targetsMap: Record<string, string> = {}) {
  const config = promo.config || {};
  const effects: string[] = [];
  if (config.effects?.price) {
    const p = config.effects.price;
    if (p.type === "percentage") effects.push(`-${p.value}% знижка`);
    else if (p.type === "fixed") effects.push(`-${p.value}₴ знижка`);
  }
  if (config.effects?.points) {
    const p = config.effects.points;
    if (p.type === "bonus") effects.push(`+${p.value} досвіду`);
    else if (p.type === "multiplier") effects.push(`x${p.value} досвіду`);
  }
  const effectsText = effects.length > 0 ? effects.join(", ") : null;

  const targets = config.targets || {};
  let targetText = "";

  if (!targets.type || targets.type === "cart") {
    targetText = "На всі товари та послуги";
  } else if (targets.type === "entity") {
    if (targets.entitySubType === "products") targetText = "На товари";
    else if (targets.entitySubType === "sessions") targetText = "На сесії/активності";
    else if (targets.entitySubType === "games") targetText = "На настільно рольові ігри";
    else targetText = "На певні типи";

    const specificNames: string[] = [];
    if (targets.products) targets.products.forEach((id: string) => { if (targetsMap[id]) specificNames.push(targetsMap[id]) });
    if (targets.activities) targets.activities.forEach((id: string) => { if (targetsMap[id]) specificNames.push(targetsMap[id]) });

    if (specificNames.length > 0) {
      targetText += ` (${specificNames.join(", ")})`;
    }
  } else if (targets.type === "items") {
    const lines: string[] = [];
    if (targets.categories && targets.categories.length > 0) {
      const names: string[] = []
      targets.categories.forEach((id: string) => { if (targetsMap[id]) names.push(targetsMap[id]) })
      if (names.length > 0) lines.push(`Категорії: ${names.join(", ")}`);
    }
    if (targets.activities && targets.activities.length > 0) {
      const names: string[] = []
      targets.activities.forEach((id: string) => { if (targetsMap[id]) names.push(targetsMap[id]) })
      if (names.length > 0) lines.push(`Активності/Ігри: ${names.join(", ")}`);
    }
    if (targets.products && targets.products.length > 0) {
      const names: string[] = []
      targets.products.forEach((id: string) => { if (targetsMap[id]) names.push(targetsMap[id]) })
      if (names.length > 0) lines.push(`Товари: ${names.join(", ")}`);
    }
    if (lines.length > 0) {
      targetText = "На обрані типи: " + lines.join(", ");
    } else {
      targetText = "На обрані товари/послуги";
    }
  }

  const conditions: string[] = [];
  if (config.conditions?.cartConditions?.cart_total) {
    conditions.push(`Сума від ${config.conditions.cartConditions.cart_total}₴`);
  }
  if (config.conditions?.cartConditions?.cart_item_count) {
    conditions.push(`Від ${config.conditions.cartConditions.cart_item_count} товарів/активностей`);
  }
  if (config.conditions?.memberConditions?.member_is_new !== undefined) {
    conditions.push(`Для нових учасників (до ${config.conditions.memberConditions.member_is_new} днів)`);
  }
  const conditionsText = conditions.length > 0 ? conditions.join(", ") : null;

  let periodText = null;
  if (promo.startDate !== -1 && promo.endDate !== -1) {
    const formatD = (ts: number) => {
      const d = new Date(ts * 1000);
      return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Kyiv" });
    }
    periodText = `з ${formatD(promo.startDate)} по ${formatD(promo.endDate)}`;
  }

  return { effectsText, targetText: targetText || null, conditionsText, periodText };
}

export function ProfileTab() {
  const [qrExpanded, setQrExpanded] = useState(false)
  const [prizesExpanded, setPrizesExpanded] = useState(false)
  const [promosExpanded, setPromosExpanded] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isLevelRoadmapOpen, setIsLevelRoadmapOpen] = useState(false)

  const { member, isLoading: isMemberLoading, error: memberError, refreshMember } = useMember()
  const { levels, isLoading: isLevelsLoading, error: levelsError } = useLevels()

  const isLoading = isMemberLoading || isLevelsLoading
  const error = memberError || levelsError

  const [animatedProgress, setAnimatedProgress] = useState(0)

  let currentLevel: any, currentIdx = 0, nextLevel: any, progressClamped = 0;
  let promotions: any[] = [];
  let unclaimedPrizes: any[] = [];
  // Card mini-tower: exactly 3 floor slots, bottom-up order for <Tower>.
  let cardFloors: TowerFloor[] = [];
  let isMaxLevel = false;
  let floorCaption = "";

  if (member && levels.length > 0) {
    currentLevel = levels.find((l: any) => l.levelId === member.levelId) || levels[0]
    currentIdx = levels.findIndex((l: any) => l.levelId === member.levelId)
    if (currentIdx === -1) currentIdx = 0;

    nextLevel = currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null
    isMaxLevel = !nextLevel

    const progress = nextLevel
      ? ((member.pointsBalance - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
      : 100
    progressClamped = Math.min(Math.max(progress, 0), 100)

    promotions = member.promotions || []
    unclaimedPrizes = member.unclaimedPrizes || []

    const currentFloor: TowerFloor = {
      id: currentLevel.levelId,
      name: currentLevel.name,
      minPoints: currentLevel.minPoints,
      status: "current",
      fillPercent: animatedProgress,
    }

    if (isMaxLevel) {
      // Max level: one completed floor below current; a roof cap is drawn separately above.
      const prev = currentIdx > 0 ? levels[currentIdx - 1] : null
      cardFloors = [
        ...(prev ? [{ id: prev.levelId, name: prev.name, minPoints: prev.minPoints, status: "completed" as const }] : []),
        currentFloor,
      ]
      floorCaption = `ПОВЕРХ ${levels.length} З ${levels.length}`
    } else if (currentIdx === 0) {
      // First level: current at full width, up to two locked floors above.
      const upper = levels.slice(currentIdx + 1, currentIdx + 3)
      cardFloors = [
        currentFloor,
        ...upper.map((lvl: any) => ({ id: lvl.levelId, name: lvl.name, minPoints: lvl.minPoints, status: "locked" as const })),
      ]
      floorCaption = `ПОВЕРХ 1 З ${levels.length}`
    } else {
      // Middle: one completed below, current, one locked above.
      const prev = levels[currentIdx - 1]
      cardFloors = [
        { id: prev.levelId, name: prev.name, minPoints: prev.minPoints, status: "completed" },
        currentFloor,
        ...(nextLevel ? [{ id: nextLevel.levelId, name: nextLevel.name, minPoints: nextLevel.minPoints, status: "locked" as const }] : []),
      ]
      floorCaption = `ПОВЕРХ ${currentIdx + 1} З ${levels.length}`
    }
  }

  useEffect(() => {
    if (isLoading || !member || levels.length === 0) return
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      setAnimatedProgress(progressClamped)
      return
    }
    const timer = setTimeout(() => setAnimatedProgress(progressClamped), 80)
    return () => clearTimeout(timer)
  }, [isLoading, member, progressClamped])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-white/5 rounded w-1/2 mb-2" />
            <div className="h-4 bg-white/5 rounded w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 bg-white/5 rounded-xl" />
          <div className="h-10 bg-white/5 rounded-xl" />
        </div>
        <div className="h-32 bg-white/5 rounded-2xl" />
        <div className="h-14 bg-white/5 rounded-2xl" />
        <div className="h-14 bg-white/5 rounded-2xl" />
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 items-center justify-center min-h-[50vh] text-center">
        <p className="text-guild-text-muted">{error || "Учасника не знайдено"}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24">
      {/* Profile Info */}
      <div className="flex items-center gap-3 mb-2">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-guild-card-hover border-2 border-guild-gold/30 flex items-center justify-center shrink-0 overflow-hidden" data-radius-exempt>
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">🐱</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl uppercase tracking-wide text-guild-text truncate">
            Привіт, {member.firstName} {member.lastName}!
          </h2>
          <div className="flex gap-2 mt-2">
            {(() => {
              const stats = (member.statistics as Record<string, number>) || {};
              const oneshots = stats["Ваншоти"] || 0;
              const quests = stats["Квести"] || 0;

              if (oneshots === 0 && quests === 0) {
                return (
                  <div className="text-xs text-guild-text-muted whitespace-nowrap">
                    Немає активностей
                  </div>
                );
              }

              return (
                <>
                  {oneshots > 0 && (
                    <div className="font-mono text-[10px] tracking-wider uppercase text-guild-gold border border-guild-gold/45 px-2 py-1 whitespace-nowrap">
                      {oneshots} Ваншотів
                    </div>
                  )}
                  {quests > 0 && (
                    <div className="font-mono text-[10px] tracking-wider uppercase text-guild-gold border border-guild-gold/45 px-2 py-1 whitespace-nowrap">
                      {quests} Квестів
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className="h-11 border border-guild-gold/35 flex items-center justify-center font-mono text-[11px] uppercase tracking-wider text-guild-text transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
        >
          Змінити профіль
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="h-11 border border-guild-gold/35 flex items-center justify-center font-mono text-[11px] uppercase tracking-wider text-guild-text transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
        >
          Налаштування
        </button>
      </div>

      {/* Level Progress */}
      <div
        className="border-2 border-guild-gold p-4 flex gap-4 cursor-pointer active:opacity-80 transition-opacity"
        onClick={() => setIsLevelRoadmapOpen(true)}
      >
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-[0.24em] text-guild-gold uppercase">Рівень</span>
            <span className="font-mono text-base font-bold text-guild-pure-gold">
              {Math.round(progressClamped)}%
            </span>
          </div>
          <div className="font-heading text-2xl font-bold uppercase leading-tight mt-2.5 mb-1.5 text-guild-text">
            {currentLevel.name}
          </div>
          <div className="font-mono text-xs text-guild-pure-gold mt-auto">
            {isMaxLevel
              ? `${member.pointsBalance.toLocaleString("uk-UA")} XP`
              : `${member.pointsBalance.toLocaleString("uk-UA")} / ${nextLevel.minPoints.toLocaleString("uk-UA")} XP`}
          </div>
          <div className="font-mono text-[10px] tracking-wider text-guild-text-muted uppercase mt-1.5">
            {isMaxLevel ? "Вежа збудована" : `До рівня «${nextLevel.name}»`}
          </div>
        </div>

        {/* Mini tower: exactly 3 floor slots, fixed card height at every level */}
        <div className="w-[104px] shrink-0 flex flex-col justify-end">
          {isMaxLevel && (
            <div
              className="mx-auto mb-[3px] shrink-0"
              style={{ width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderBottom: "20px solid var(--color-guild-gold)" }}
            />
          )}
          <Tower floors={cardFloors} compact />
          <div className="font-mono text-[9px] tracking-wider text-guild-text-dim text-center mt-1.5 whitespace-nowrap">
            {floorCaption}
          </div>
        </div>
      </div>

      {/* POS QR Code (collapsible) */}
      <div className={`border bg-guild-modal-bg overflow-hidden transition-[border-width] ${qrExpanded ? "border-2 border-guild-gold" : "border-guild-card-border"}`}>
        <button
          onClick={() => setQrExpanded(!qrExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <CategoryIcon shape="square" glyph="QR" size={38} className="text-guild-gold shrink-0" />
            <div className="min-w-0 text-left">
              <span className="font-heading uppercase tracking-wide text-base text-guild-text block">QR код для нарахування</span>
              <span className="font-mono text-[10px] text-guild-text-dim block mt-1 leading-snug whitespace-nowrap">
                покажіть адміністратору
              </span>
            </div>
          </div>
          <span className="font-mono text-guild-gold text-sm w-5 text-center shrink-0">
            {qrExpanded ? "–" : "+"}
          </span>
        </button>

        {/* Expanded QR */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${qrExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 flex justify-center">
              <QrCodeDisplay value={member.qrcode} size={180} />
            </div>
          </div>
        </div>
      </div>

      {/* Prizes Card */}
      <div className={`border bg-guild-modal-bg overflow-hidden transition-[border-width] ${prizesExpanded ? "border-2 border-guild-gold" : "border-guild-card-border"}`}>
        <button
          onClick={() => setPrizesExpanded(!prizesExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <CategoryIcon shape="square" glyph={String(unclaimedPrizes.length)} size={38} className="text-guild-gold shrink-0" />
            <div className="min-w-0 text-left">
              <h3 className="font-heading uppercase tracking-wide text-base text-guild-text">Призи</h3>
              <span className={`font-mono text-[10px] block mt-1 leading-snug ${unclaimedPrizes.length > 0 ? "text-guild-pure-gold" : "text-guild-text-dim"}`}>
                {unclaimedPrizes.length > 0
                  ? `на вас чекає ${unclaimedPrizes.length} ${getPrizeWord(unclaimedPrizes.length)}!`
                  : "немає незабраних призів"}
              </span>
            </div>
          </div>
          <span className="font-mono text-guild-gold text-sm w-5 text-center shrink-0">
            {prizesExpanded ? "–" : "+"}
          </span>
        </button>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${prizesExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-6 pb-4 flex flex-col gap-4">
              {unclaimedPrizes.length > 0 ? (
                unclaimedPrizes.map((prize, i) => {
                  const prizeNames = (prize.prizesString || "")
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                  return (
                    <div key={i}>
                      {/* Level section header */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <h4 className="text-xs font-bold tracking-widest uppercase shrink-0 text-guild-gold">
                          {prize.levelName}
                        </h4>
                        <div className="h-px flex-1 bg-guild-divider" />
                      </div>
                      {/* Individual prize items */}
                      <div className="flex flex-col gap-2 pl-2">
                        {prizeNames.map((name: string, j: number) => (
                          <div key={j} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-guild-gold rotate-45 shrink-0" />
                            <span className="text-guild-text font-medium text-sm leading-tight">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-guild-text-muted text-center">Немає незабраних винагород</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discounts/Promos Card */}
      <div className={`border bg-guild-modal-bg overflow-hidden transition-[border-width] ${promosExpanded ? "border-2 border-guild-gold" : "border-guild-card-border"}`}>
        <button
          onClick={() => setPromosExpanded(!promosExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <CategoryIcon shape="square" glyph="%" size={38} className="text-guild-gold shrink-0" />
            <div className="min-w-0 text-left">
              <h3 className="font-heading uppercase tracking-wide text-base text-guild-text">Знижки</h3>
              <span className="font-mono text-[10px] text-guild-text-dim block mt-1 leading-snug">
                {promotions.length > 0
                  ? `${promotions.length} ${getDiscountWord(promotions.length)} доступно`
                  : "Знижок немає"}
              </span>
            </div>
          </div>
          <span className="font-mono text-guild-gold text-sm w-5 text-center shrink-0">
            {promosExpanded ? "–" : "+"}
          </span>
        </button>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${promosExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="ml-[26px]">
              {promotions.length > 0 ? (
                promotions.map((promo, i) => {
                  const { effectsText, targetText, conditionsText, periodText } = formatPromoData(promo, member?.targetsMap);
                  return (
                    <div key={i} className="border-t border-guild-gold/15 first:border-t-0 py-2.5">
                      <div className="flex items-start gap-2.5">
                        <TicketIcon className="mt-[3px]" />
                        <div className="flex-1 min-w-0">
                          <span className={`font-heading text-[15px] uppercase tracking-wide leading-tight block ${promo.isPersonal ? "text-guild-pure-gold" : "text-guild-text"}`}>
                            {promo.name}
                          </span>
                          {promo.description && (
                            <p className="text-guild-text-muted text-[13px] leading-relaxed mt-1.5">{promo.description}</p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {effectsText && (
                              <span className="font-mono text-[10px] tracking-[0.14em] uppercase bg-guild-gold text-guild-bg-bottom font-bold px-2 py-1 whitespace-nowrap">
                                {effectsText}
                              </span>
                            )}
                            {targetText && (
                              <span className="font-mono text-[10px] tracking-[0.14em] uppercase border border-guild-gold/50 text-guild-gold px-2 py-1">
                                {targetText}
                              </span>
                            )}
                            {conditionsText && (
                              <span className="font-mono text-[10px] tracking-[0.14em] uppercase border border-dashed border-guild-text-dim text-guild-text-muted px-2 py-1">
                                {conditionsText}
                              </span>
                            )}
                          </div>

                          {(periodText || promo.promoCode) && (
                            <div className="flex items-center justify-between gap-2.5 mt-3">
                              <span className="font-mono text-[10px] tracking-[0.14em] text-guild-text-dim uppercase whitespace-nowrap">
                                {periodText}
                              </span>
                              {promo.promoCode && <CopyCodeChip code={promo.promoCode} />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-guild-text-muted py-2 text-center">Знижок немає</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        member={member}
        onSuccess={refreshMember}
      />
      <LevelRoadmapPopover
        isOpen={isLevelRoadmapOpen}
        onClose={() => setIsLevelRoadmapOpen(false)}
      />
    </div>
  )
}
