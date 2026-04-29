import { HelpCircleIcon, Users } from "lucide-react"
import { GuildLogo } from "./GuildLogo"

interface HeaderProps {
  onInviteClick: () => void
  onMenuClick: () => void
}

export function Header({ onInviteClick, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      {/* Invite friends button */}
      <button
        onClick={onInviteClick}
        className="p-2 rounded-xl transition-colors active:bg-white/10"
        aria-label="Запросити друзів"
      >
        <Users className="w-6 h-6 text-guild-gold" />
      </button>

      {/* Center logo only */}
      <GuildLogo className="h-16 w-auto" />

      {/* Help menu */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl transition-colors active:bg-white/10"
        aria-label="Меню"
      >
        <HelpCircleIcon className="w-6 h-6 text-guild-gold" />
      </button>
    </header>
  )
}
