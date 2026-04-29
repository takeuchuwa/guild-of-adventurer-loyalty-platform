import { useState, useEffect } from "react"
import { X, Copy, ScrollText, Send, Check, Loader2 } from "lucide-react"
import { QrCodeDisplay } from "./QrCodeDisplay"
import { useReferralRules } from "@/hooks/useReferralRules"

interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
}

export function ReferralModal({ isOpen, onClose, memberId }: ReferralModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [copied, setCopied] = useState(false)

  const { rules, isLoading, error } = useReferralRules(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsClosing(false)
      setCopied(false)
    } else if (isRendered) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setIsRendered(false)
        setIsClosing(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isRendered])

  if (!isRendered) return null

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
    const shareText = encodeURIComponent("Приєднуйся до Гільдії Авантюристів та отримуй бонуси!");
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
    <>
      <div
        className={`modal-overlay ${isClosing ? 'animate-fadeOut' : ''}`}
        onClick={onClose}
      />
      <div
        className={`modal-content flex flex-col overscroll-y-none ${isClosing ? 'animate-slideDown' : ''}`}
        onClick={onClose}
      >
        <div className="flex-1 shrink-0 min-h-32 cursor-pointer" onClick={onClose} />
        <div
          className="w-full bg-guild-modal-bg rounded-t-[2.5rem] shadow-2xl flex flex-col items-center pb-12 relative border-t border-white/5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold Drag Handle */}
          <div className="w-12 h-1.5 bg-white/10 rounded-full mt-4 mb-2"></div>

          {/* Header */}
          <div className="w-full flex justify-end px-8 pt-2">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200"
            >
              <X className="w-5 h-5 text-guild-text-muted" />
            </button>
          </div>

          {/* Title Block */}
          <div className="px-8 mt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-guild-gold mb-3">
              Запросити друзів
            </h1>
            <p className="text-guild-text-muted text-sm leading-relaxed max-w-[280px] mx-auto">
              Ви можете запросити приєднатися своїх друзів і отримати за це додаткові бали досвіду!
            </p>
          </div>

          {/* QR Code Section */}
          <div className="mt-8 relative group">
            <div className="absolute inset-0 bg-guild-gold/10 blur-2xl rounded-full group-hover:bg-guild-gold/20 transition-all duration-700"></div>
            <div className="relative p-5 rounded-[2rem] outline outline-1 outline-guild-gold/20 shadow-[0_0_25px_rgba(229,193,146,0.15)] bg-black/20" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div className="bg-white p-3 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden">
                <QrCodeDisplay value={referralLink} size={180} />
              </div>
            </div>
          </div>

          {/* Rules Card */}
          {(isLoading || rules.length > 0 || error) && (
            <div className="w-full px-6 mt-10">
              <div className="rounded-2xl p-5 border-l-4 border-guild-gold/40 bg-black/20" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <ScrollText className="w-5 h-5 text-guild-gold-light" />
                  <h2 className="text-base font-semibold text-guild-gold">
                    Правила отримання додаткових балів
                  </h2>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-guild-gold animate-spin" />
                  </div>
                ) : error ? (
                  <p className="text-sm text-red-400 text-center py-2">{error}</p>
                ) : (
                  <ul className="space-y-4">
                    {rules.map((rule) => (
                      <li key={rule.levelId} className="flex items-start gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-guild-gold-light shrink-0"></div>
                        <p className="text-sm text-guild-text/90">
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
            </div>
          )}

          {/* Link Display Section */}
          <div className="w-full px-6 mt-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-guild-text-muted ml-1">
                Ваше унікальне посилання
              </label>
              <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl outline outline-1 outline-white/10">
                <div className="flex-1 overflow-hidden px-3">
                  <span className="font-mono text-[13px] text-guild-green-light truncate block">
                    {referralLink}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-guild-gold/10 hover:bg-guild-gold/20 text-guild-gold px-4 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 group w-[150px] justify-center"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{copied ? 'Скопійовано' : 'Копіювати'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="w-full px-6 mt-6">
            <button
              onClick={handleShare}
              className="w-full py-4 rounded-full bg-gradient-to-r from-guild-gold to-guild-gold-light text-black font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-guild-gold/10 active:scale-[0.98] transition-transform"
            >
              <Send className="w-4 h-4" />
              Поділитися в Telegram
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
