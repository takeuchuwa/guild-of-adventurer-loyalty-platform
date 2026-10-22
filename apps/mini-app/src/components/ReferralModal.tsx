import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { BottomSheet, SheetTitleRow } from "./BottomSheet"
import { QrCodeDisplay } from "./QrCodeDisplay"
import { useReferralRules } from "@/hooks/useReferralRules"

interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
}

export function ReferralModal({ isOpen, onClose, memberId }: ReferralModalProps) {
  const [copied, setCopied] = useState(false)

  const { rules, isLoading, error } = useReferralRules(isOpen)

  useEffect(() => {
    if (isOpen) setCopied(false)
  }, [isOpen])

  const botName = import.meta.env.VITE_BOT_NAME || 'GuildAdventurerBot'
  const referralLink = `https://t.me/${botName}?start=${memberId}`

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = referralLink
        // Avoid scrolling to bottom
        textArea.style.top = "0"
        textArea.style.left = "0"
        textArea.style.position = "fixed"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed', err)
        }
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error("Copy failed", e)
    }
  }

  const handleShare = () => {
    const shareText = encodeURIComponent("Приєднуйся до Вежі та отримуй бонуси!");
    const shareUrl = encodeURIComponent(referralLink);
    // Use Telegram Web App API if available
    // @ts-ignore
    if (window.Telegram?.WebApp?.openTelegramLink) {
      // @ts-ignore
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
    } else {
      window.open(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`, '_blank');
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      header={
        <SheetTitleRow
          title="Запросити друзів"
          subtitle="Ви можете запросити приєднатися своїх друзів і отримати за це додаткові бали досвіду!"
          onClose={onClose}
        />
      }
      footer={
        <button
          onClick={handleShare}
          className="w-full h-[52px] shrink-0 bg-guild-gold text-guild-bg-bottom font-heading font-semibold text-[17px] flex items-center justify-center gap-2 uppercase tracking-[0.1em] active:opacity-90 transition-opacity mt-4"
        >
          Поділитися в Telegram
        </button>
      }
    >
      {/* QR Code Section */}
      <div className="flex justify-center border-2 border-guild-gold p-4.5 mb-4.5">
        <QrCodeDisplay value={referralLink} size={180} />
      </div>

      {/* Rules Card */}
      {(isLoading || rules.length > 0 || error) && (
        <div className="border border-guild-gold/25 p-4 mb-4">
          <span className="font-mono text-[9px] tracking-[0.2em] text-guild-gold uppercase block mb-2.5">
            Правила нарахування
          </span>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-guild-gold animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-guild-negative text-center py-2">{error}</p>
          ) : (
            <ul className="space-y-3">
              {rules.map((rule) => (
                <li key={rule.levelId} className="flex items-start gap-2.5">
                  <div className="mt-[5px] w-2 h-2 bg-guild-gold rotate-45 shrink-0"></div>
                  <p className="text-sm text-guild-text/90 leading-relaxed">
                    Коли ваш друг досягає рівня <span className="text-guild-gold font-bold">«{rule.levelName}»</span>,{" "}
                    {rule.pointsForReferred === rule.pointsForReferrer ? (
                      <>ви обоє отримуєте <span className="text-guild-gold font-bold">{rule.pointsForReferred} досвіду</span></>
                    ) : (
                      <>
                        він отримує <span className="text-guild-gold font-bold">{rule.pointsForReferred} досвіду</span>, а ви —{" "}
                        <span className="text-guild-gold font-bold">{rule.pointsForReferrer} досвіду</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Link Display Section */}
      <span className="font-mono text-[9px] tracking-[0.2em] text-guild-text-muted uppercase block mb-2">
        Ваше унікальне посилання
      </span>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 h-[46px] border border-guild-gold/25 flex items-center px-3 overflow-hidden">
          <span className="font-mono text-[11px] text-guild-text-muted truncate block">
            {referralLink}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="w-24 h-[46px] shrink-0 border border-guild-gold text-guild-gold flex items-center justify-center gap-1.5 transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
        >
          <span className="font-mono text-[10px] tracking-wider uppercase">{copied ? 'Скопійовано' : 'Копіювати'}</span>
        </button>
      </div>
    </BottomSheet>
  )
}
