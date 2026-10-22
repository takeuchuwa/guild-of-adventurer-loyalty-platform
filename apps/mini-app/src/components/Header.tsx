interface HeaderProps {
  onInviteClick: () => void
  onMenuClick: () => void
}

export function Header({ onInviteClick, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-guild-card-border">
      {/* Invite friends button */}
      <button
        onClick={onInviteClick}
        className="w-9 h-9 flex items-center justify-center border-2 border-guild-gold text-guild-gold font-mono text-[11px] transition-colors active:bg-guild-gold active:text-guild-bg-bottom"
        aria-label="Запросити друзів"
      >
        +1
      </button>

      {/* "V" monogram */}
      <div className="w-[34px] h-[34px] flex items-center justify-center border-2 border-guild-gold text-guild-gold font-heading font-bold text-xl leading-none">
        V
      </div>

      {/* Help menu */}
      <button
        onClick={onMenuClick}
        className="relative w-9 h-9 flex items-center justify-center group"
        aria-label="Меню"
      >
        <span className="absolute w-[27px] h-[27px] border-2 border-guild-gold rotate-45 transition-colors group-active:bg-guild-gold" />
        <span className="relative font-mono text-[13px] text-guild-gold transition-colors group-active:text-guild-bg-bottom">?</span>
      </button>
    </header>
  )
}
