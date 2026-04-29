import { useState, useEffect } from "react"
import { Settings, UserPen, ChevronDown, Gift, Trophy, Ticket, Target, Tag, Calendar } from "lucide-react"
import { QrCodeDisplay } from "@/components/QrCodeDisplay"
import { Badge } from "@/components/ui/badge"
import { useMember } from "@/hooks/useMember"
import { useLevels } from "@/hooks/useLevels"
import { SettingsModal } from "@/components/SettingsModal"
import { EditProfileModal } from "@/components/EditProfileModal"
import { LevelRoadmapPopover } from "@/components/LevelRoadmapPopover"

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

  let currentLevel: any, currentIdx: number, nextLevel: any, prevLevel: any, progressClamped = 0;
  let promotions: any[] = [];
  let unclaimedPrizes: any[] = [];

  if (member && levels.length > 0) {
    currentLevel = levels.find((l: any) => l.levelId === member.levelId) || levels[0]
    currentIdx = levels.findIndex((l: any) => l.levelId === member.levelId)
    if (currentIdx === -1) currentIdx = 0;

    nextLevel = currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null
    prevLevel = currentIdx > 0 ? levels[currentIdx - 1] : null

    const progress = nextLevel
      ? ((member.pointsBalance - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
      : 100
    progressClamped = Math.min(Math.max(progress, 0), 100)

    promotions = member.promotions || []
    unclaimedPrizes = member.unclaimedPrizes || []
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
        <div className="w-14 h-14 rounded-full bg-guild-card-hover border-2 border-guild-gold/30 flex items-center justify-center shrink-0 overflow-hidden">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">🐱</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-guild-text truncate">
            Привіт, {member.firstName} {member.lastName}!
          </h2>
          <div className="flex gap-4 mt-1">
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
                    <div className="text-xs text-guild-text-muted whitespace-nowrap">
                      <span className="font-semibold text-guild-text">{oneshots}</span> Ваншотів
                    </div>
                  )}
                  {quests > 0 && (
                    <div className="text-xs text-guild-text-muted whitespace-nowrap">
                      <span className="font-semibold text-guild-text">{quests}</span> Квестів
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
          className="glass-card flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-guild-text-muted transition-colors"
        >
          <UserPen className="w-4 h-4" />
          Змінити профіль
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="glass-card flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium text-guild-text-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
          Налаштування
        </button>
      </div>

      {/* Level Progress */}
      <div
        className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform relative"
        onClick={() => setIsLevelRoadmapOpen(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-guild-text-muted uppercase tracking-wider">Рівень</h3>
          <span className="text-sm font-semibold text-guild-orange">
            {Math.round(progressClamped)}%
          </span>
        </div>

        {/* Progress bar with current level badge */}
        <div className="relative mt-8 mb-1">
          {/* Current level badge – animated with fill and edge clamping */}
          {(() => {
            // Logic to keep badge centered but clamp it at container edges
            // 0% progress -> translateX(0%)
            // 15% - 85% progress -> translateX(-50%)
            // 100% progress -> translateX(-100%)
            let translateX = -50
            if (animatedProgress < 15) {
              translateX = (animatedProgress / 15) * -50
            } else if (animatedProgress > 85) {
              translateX = -50 - ((animatedProgress - 85) / 15) * 50
            }

            return (
              <div
                className="absolute -top-7 pointer-events-none transition-all duration-700"
                style={{
                  left: `${animatedProgress}%`,
                  transform: `translateX(${translateX}%)`,
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              >
                <Badge
                  variant="default"
                  shiny
                  className="bg-guild-orange whitespace-nowrap"
                >
                  {currentLevel.name}
                </Badge>
              </div>
            )
          })()}

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>

          {/* Prev / Next level labels & Experience counter – below the bar */}
          <div className="relative flex items-center justify-between mt-1.5 min-h-6">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-guild-text-dim/20 text-guild-text-muted font-bold">
              {prevLevel?.name || "—"}
            </span>

            <div className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-guild-text-dim whitespace-nowrap">
              {nextLevel
                ? `${member.pointsBalance - currentLevel.minPoints} / ${nextLevel.minPoints - currentLevel.minPoints} досвіду`
                : "Максимальний рівень досягнуто! 🎉"}
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-guild-text-dim/20 text-guild-text-muted font-bold">
              {nextLevel?.name || "Макс"}
            </span>
          </div>
        </div>
      </div>

      {/* POS QR Code (collapsible) */}
      <div className={`glass-card overflow-hidden transition-all duration-400 ${qrExpanded ? '' : ''}`}>
        <button
          onClick={() => setQrExpanded(!qrExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-guild-gold/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-guild-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14h3v3h-3zM14 17h3v3h-3zM17 20h3" />
              </svg>
            </div>
            <span className="font-bold text-guild-text">QR код для нарахування</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-guild-text-muted transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${qrExpanded ? "rotate-180" : ""
              }`}
          />
        </button>

        {/* Expanded QR */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${qrExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col items-center gap-2">
              <QrCodeDisplay value={member.qrcode} size={180} />
              <p className="text-xs text-guild-text-dim text-center pt-2">
                Проскануйте код в адміністратора для нарахування досвіду
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prizes Card */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setPrizesExpanded(!prizesExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-guild-gold/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-guild-gold" />
            </div>
            <h3 className="text-base font-bold text-guild-text">Призи</h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-guild-text-muted transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${prizesExpanded ? "rotate-180" : ""
              }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${prizesExpanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-3">
              <p className="text-xs text-guild-text-muted pl-8">
                {unclaimedPrizes.length > 0
                  ? `На вас чекає ${unclaimedPrizes.length} ${getPrizeWord(unclaimedPrizes.length)}!`
                  : "Немає незабраних призів"}
              </p>
            </div>
          </div>
        </div>

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
                            <div className="w-1.5 h-1.5 rounded-full bg-guild-gold shadow-[0_0_6px_rgba(200,166,121,0.6)] shrink-0" />
                            <span className="text-guild-text font-medium text-sm leading-tight">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-guild-text-muted">Немає незабраних винагород</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discounts/Promos Card */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setPromosExpanded(!promosExpanded)}
          className="w-full flex items-center justify-between p-4 relative z-10"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-guild-text">Знижки</h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-guild-text-muted transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${promosExpanded ? "rotate-180" : ""
              }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${promosExpanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-3">
              <p className="text-xs text-guild-text-muted pl-8">
                {promotions.length > 0
                  ? `${promotions.length} ${getDiscountWord(promotions.length)} доступно`
                  : "Знижок немає"}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${promosExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-3 relative z-0 mt-2">
              <div className="absolute left-8 top-0 bottom-4 w-px bg-white/5" />
              {promotions.length > 0 ? (
                promotions.map((promo, i) => {
                  const { effectsText, targetText, conditionsText, periodText } = formatPromoData(promo, member?.targetsMap);
                  return (
                    <div key={i} className="flex items-start relative pl-12 py-1">
                      <div className="absolute left-8 top-2 -ml-[3.5px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <div className="flex flex-col items-start w-full -mt-0.5">
                        <span className="text-guild-text font-semibold text-sm flex items-start gap-1.5 leading-tight">
                          <Ticket className="w-4 h-4 text-emerald-400 mt-px shrink-0" />
                          <span className={promo.isPersonal ? "text-amber-300" : ""}>{promo.name}</span>
                        </span>
                        {promo.description && (
                          <span className="text-guild-text-dim text-xs block mt-1 pl-5">{promo.description}</span>
                        )}

                        <div className="flex flex-col gap-1.5 mt-2 mb-1 bg-white/5 p-3 rounded-lg border border-white/5 w-full">
                          {targetText && (
                            <span className="text-guild-text-dim text-xs leading-none flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-guild-text shrink-0" />
                              <span><span className="text-guild-text font-medium">Діє:</span> {targetText}</span>
                            </span>
                          )}
                          {effectsText && (
                            <span className="text-guild-text-dim text-xs leading-tight flex items-start gap-1.5">
                              <Gift className="w-3.5 h-3.5 text-guild-text mt-px shrink-0" />
                              <span><span className="text-guild-text font-medium">Ефект:</span> {effectsText}</span>
                            </span>
                          )}
                          {conditionsText && (
                            <span className="text-guild-text-dim text-xs leading-tight flex items-start gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-guild-text mt-px shrink-0" />
                              <span><span className="text-guild-text font-medium">Умови:</span> {conditionsText}</span>
                            </span>
                          )}
                          {periodText && (
                            <span className="text-guild-text-dim text-xs leading-tight flex items-start gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-guild-text mt-px shrink-0" />
                              <span><span className="text-guild-text font-medium">Дія:</span> {periodText}</span>
                            </span>
                          )}
                        </div>

                        {promo.promoCode && (
                          <Badge variant="secondary" className="mt-1 font-mono text-[11px] text-emerald-400 bg-emerald-400/10 border-emerald-400/20 px-2 py-0.5 h-auto">
                            {promo.promoCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-guild-text-muted pl-12">Знижок немає</p>
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
