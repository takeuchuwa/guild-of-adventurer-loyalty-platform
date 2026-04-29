import { useState, useEffect } from "react"
import { X, HelpCircle, Dice5, ShoppingBag, Star, Users } from "lucide-react"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const helpItems = [
  {
    icon: Dice5,
    title: "Грайте в ігри",
    text: "Беріть участь у партіях D&D, Daggerheart та інших настільних пригодах.",
  },
  {
    icon: ShoppingBag,
    title: "Купуйте в таверні",
    text: "Смакуйте напої та їжу в нашому закладі. Кожне замовлення додає вам досвіду.",
  },
  {
    icon: Star,
    title: "Підвищуйте рівень",
    text: "Накопичуйте досвід, щоб розблокувати постійні знижки та унікальні призи гільдії.",
  },
  {
    icon: Users,
    title: "Запрошуйте друзів",
    text: "Приводьте нових авантюристів до гільдії та отримуйте реферальні бонуси.",
  },
]

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsClosing(false)
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
          className="w-full bg-guild-modal-bg rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col relative border-t border-white/5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="flex flex-col items-center pt-3 pb-6 px-6 relative">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mb-6"></div>

            {/* Close Icon */}
            <div className="absolute top-6 right-6">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200"
              >
                <X className="w-5 h-5 text-guild-text-muted" />
              </button>
            </div>

            {/* Hero Icon & Title */}
            <div className="flex flex-col items-center gap-4 text-center mt-4">
              <div className="w-20 h-20 rounded-full bg-guild-gold/10 flex items-center justify-center shadow-[0_0_32px_rgba(229,193,146,0.15)]">
                <HelpCircle className="w-10 h-10 text-guild-gold" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-guild-gold">
                Як це працює?
              </h1>
              <p className="text-guild-text-muted font-medium max-w-[280px]">
                Станьте частиною легенди та отримуйте нагороди за свої пригоди.
              </p>
            </div>
          </div>

          {/* Cards List (Content) */}
          <div className="px-6 pb-6 space-y-3">
            {helpItems.map((item, i) => (
              <div key={i} className="glass-card bg-black/20 outline outline-1 outline-white/5 p-5 rounded-xl flex items-start gap-4 hover:bg-white/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-guild-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-guild-text leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-guild-text-muted text-sm mt-1 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}

            <p className="text-guild-text-dim text-sm font-medium tracking-wide text-center pb-4">
              Якщо у вас є запитання, звертайтеся до адміністраторів гільдії.
            </p>

          </div>


        </div>
      </div>
    </>
  )
}
