import { BottomSheet } from "./BottomSheet"
import { CategoryIcon } from "./CategoryIcon"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const helpItems: { shape: "hex" | "square" | "diamond"; glyph: string; title: string; text: string }[] = [
  {
    shape: "hex",
    glyph: "20",
    title: "Грайте в ігри",
    text: "Беріть участь у партіях D&D, Daggerheart та інших настільних пригодах.",
  },
  {
    shape: "square",
    glyph: "₴",
    title: "Купуйте в таверні",
    text: "Смакуйте напої та їжу в нашому закладі. Кожне замовлення додає вам досвіду.",
  },
  {
    shape: "hex",
    glyph: "XP",
    title: "Підвищуйте рівень",
    text: "Накопичуйте досвід, щоб розблокувати постійні знижки та унікальні призи Вежі.",
  },
  {
    shape: "diamond",
    glyph: "+1",
    title: "Запрошуйте друзів",
    text: "Приводьте нових підкорювачів до Вежі та отримуйте реферальні бонуси.",
  },
]

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      header={
        <div className="relative shrink-0 mb-4.5">
          <button
            onClick={onClose}
            className="absolute right-0 top-0 w-[34px] h-[34px] flex items-center justify-center border border-guild-gold/40 font-mono text-guild-gold text-sm transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
            aria-label="Закрити"
          >
            ×
          </button>
          <div className="flex flex-col items-center gap-3.5 text-center pt-1">
            <CategoryIcon shape="diamond" glyph="?" size={64} className="text-guild-gold" />
            <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-guild-text">
              Як це працює?
            </h1>
            <p className="text-guild-text-muted text-sm leading-relaxed max-w-[280px]">
              Станьте частиною легенди та отримуйте нагороди за свої пригоди.
            </p>
          </div>
        </div>
      }
    >
      {helpItems.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 py-3.5 border-t border-guild-card-border first:border-t-0"
        >
          <CategoryIcon shape={item.shape} glyph={item.glyph} size={34} className="text-guild-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base uppercase tracking-wide text-guild-text leading-tight">
              {item.title}
            </h3>
            <p className="text-guild-text-muted text-[13px] mt-1.5 leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}

      <p className="font-mono text-[10px] tracking-wider text-guild-text-dim uppercase text-center border-t border-guild-card-border pt-3.5 mt-1">
        Якщо у вас є запитання, звертайтеся до адміністраторів Вежі.
      </p>
    </BottomSheet>
  )
}
