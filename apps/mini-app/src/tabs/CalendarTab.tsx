import { CategoryIcon } from "@/components/CategoryIcon"

export function CalendarTab() {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 pb-24 pt-8 min-h-[70vh]">

      {/* Hatched teaser square */}
      <div
        className="relative w-[150px] h-[150px] border-2 border-guild-gold flex items-center justify-center mb-8"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, rgba(201,158,58,.14) 0 2px, transparent 2px 9px)",
        }}
      >
        <div className="relative w-[66px] h-[66px] flex items-center justify-center">
          <span className="absolute w-[43px] h-[43px] border-2 border-guild-gold rotate-45" />
          <span className="relative font-mono text-[15px] text-guild-gold">23</span>
        </div>
        {/* Danger corner mark */}
        <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-guild-negative" />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center text-center gap-4 w-full max-w-sm">
        <span className="font-mono text-[10px] tracking-[0.24em] text-guild-gold uppercase border border-guild-gold/45 px-3.5 py-1.5">
          Незабаром
        </span>

        <h2 className="font-heading text-[28px] font-semibold uppercase tracking-wide text-guild-text mt-1">
          Календар подій
        </h2>

        <p className="text-sm text-guild-text-muted leading-relaxed max-w-xs">
          Ми готуємо щось особливе для справжніх шукачів пригод. Календар сесій та інших івентів з'явиться тут дуже скоро!
        </p>

        {/* Ghosted placeholder slots */}
        <div className="grid grid-cols-2 gap-[2px] bg-guild-card-border/60 w-full mt-4 opacity-45">
          <div className="bg-guild-modal-bg flex flex-col items-center justify-center gap-3 py-5 px-4">
            <CategoryIcon shape="hex" glyph="20" size={40} className="text-guild-text-muted" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-guild-text-muted">
              НРІ сесії
            </span>
          </div>
          <div className="bg-guild-modal-bg flex flex-col items-center justify-center gap-3 py-5 px-4">
            <div className="w-6 h-6 my-2 border-2 border-guild-text-muted rotate-45" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-guild-text-muted">
              Квести
            </span>
          </div>
        </div>
      </div>

      {/* Bottom atmospheric gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-linear-to-t from-guild-bg-bottom to-transparent -z-10 pointer-events-none" />
    </div>
  )
}

