import { useEffect, useState, type ReactNode, type Ref } from "react"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  header: ReactNode
  footer?: ReactNode
  children: ReactNode
  contentRef?: Ref<HTMLDivElement>
}

// Shared shell for all bottom sheets: 82% dim overlay, coal plate with a 2px
// gold top edge, 52x3 handle. Handle + header stay pinned; only the body scrolls.
export function BottomSheet({ isOpen, onClose, header, footer, children, contentRef }: BottomSheetProps) {
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
      }, 240)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isRendered])

  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  if (!isRendered) return null

  return (
    <>
      <div className={`modal-overlay ${isClosing ? "animate-fadeOut" : ""}`} onClick={onClose} />
      <div
        className={`modal-content flex flex-col overscroll-y-none ${isClosing ? "animate-slideDown" : ""}`}
        onClick={onClose}
      >
        <div className="flex-1 shrink-0 min-h-32 cursor-pointer" onClick={onClose} />
        <div
          className="w-full max-h-[88vh] bg-guild-modal-bg flex flex-col relative border-t-2 border-guild-gold shrink-0 px-5 pt-3.5"
          style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom))" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-[52px] h-[3px] bg-guild-text-muted/30 mx-auto mb-5 shrink-0" />
          {header}
          <div ref={contentRef} className="overflow-y-auto -mx-5 px-5 min-h-0">
            {children}
          </div>
          {footer}
        </div>
      </div>
    </>
  )
}

// Standard title row: Oswald title (+ optional subtitle) on the left, a 34x34
// square close button on the right. Used by every sheet except Help, whose
// header is a centered hero block instead.
export function SheetTitleRow({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle?: string
  onClose: () => void
}) {
  return (
    <div className="w-full flex justify-between items-start gap-3.5 mb-5 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-guild-text">{title}</h1>
        {subtitle && <p className="text-guild-text-muted text-sm leading-relaxed mt-2">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="w-[34px] h-[34px] shrink-0 flex items-center justify-center border border-guild-gold/40 font-mono text-guild-gold text-sm transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
        aria-label="Закрити"
      >
        ×
      </button>
    </div>
  )
}
