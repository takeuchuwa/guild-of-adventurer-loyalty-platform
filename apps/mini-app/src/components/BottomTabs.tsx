import { ProfileIcon } from "@/components/icons/ProfileIcon"
import { HistoryIcon } from "@/components/icons/HistoryIcon"
import { TopIcon } from "@/components/icons/TopIcon"
import { CalendarIcon } from "@/components/icons/CalendarIcon"

export type TabId = "profile" | "history" | "top" | "calendar"

interface BottomTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export const tabs: { id: TabId; label: string; headerLabel?: string; icon: typeof ProfileIcon }[] = [
  { id: "profile", label: "Профіль", icon: ProfileIcon },
  { id: "history", label: "Історія", headerLabel: "Історія досвіду", icon: HistoryIcon },
  { id: "top", label: "Топ", headerLabel: "Таблиця лідерів", icon: TopIcon },
  { id: "calendar", label: "Календар", icon: CalendarIcon },
]

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 bg-guild-bg-bottom border-t border-guild-card-border px-3 pt-2.5"
      style={{ paddingBottom: "max(22px, env(safe-area-inset-bottom))" }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-[7px] py-1.5"
          >
            <Icon className={`transition-colors ${isActive ? "text-guild-tab-active" : "text-guild-tab-inactive"}`} />
            <span
              className={`font-mono text-[9px] tracking-[0.14em] uppercase whitespace-nowrap transition-colors ${isActive ? "text-guild-tab-active" : "text-guild-tab-inactive"
                }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
