import { Badge } from "@/components/ui/badge"
import { Calendar, Dice6, Sparkles, Users } from "lucide-react"

export function CalendarTab() {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 pb-24 pt-8 min-h-[70vh]">

      {/* Floating calendar icon with glow */}
      <div className="relative group mb-8">
        {/* Glow halo */}
        <div className="absolute -inset-8 bg-guild-gold/10 blur-[60px] rounded-full opacity-50" />

        {/* Glass card icon */}
        <div className="relative glass-card w-44 h-44 rounded-[2rem] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-guild-gold/10 to-transparent" />
          <Calendar className="w-20 h-20 text-guild-gold drop-shadow-[0_0_20px_rgba(200,166,121,0.4)]" />
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-guild-orange animate-pulse" />
          <div className="absolute bottom-5 left-5 w-1 h-1 rounded-full bg-guild-gold opacity-40" />
        </div>
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center text-center gap-4 w-full max-w-sm">
        {/* Badge */}
        <Badge
          variant="default"
          shiny
          className="px-4 py-1.5 bg-guild-card border whitespace-nowrap text-guild-orange uppercase tracking-[0.2em] border-guild-gold/15"
        >
          Незабаром
        </Badge>

        <h2 className="text-3xl font-extrabold tracking-tight text-guild-text">
          Календар подій
        </h2>

        <p className="text-sm text-guild-text-muted leading-relaxed max-w-xs">
          Ми готуємо щось особливе для справжніх шукачів пригод. Календар сесій та інших івентів з'явиться тут дуже скоро!
        </p>

        {/* Ghosted bento placeholder slots */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <div className="h-24 glass-card rounded-xl flex flex-col items-start justify-end p-4 opacity-40 grayscale">
            <Dice6 className="w-5 h-5 text-guild-gold mb-2" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-guild-text-muted">
              НРІ сесії
            </span>
          </div>
          <div className="h-24 glass-card rounded-xl flex flex-col items-start justify-end p-4 opacity-40 grayscale">
            <Sparkles className="w-5 h-5 text-guild-gold mb-2" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-guild-text-muted">
              Квести
            </span>
          </div>

        </div>
      </div>

      {/* Bottom atmospheric gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-linear-to-t from-guild-bg-bottom to-transparent -z-10 pointer-events-none" />
    </div >
  )
}

