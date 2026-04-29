import { User, History, BarChart3, Calendar } from "lucide-react"

export type TabId = "profile" | "history" | "top" | "calendar"

interface BottomTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export const tabs: { id: TabId; label: string; headerLabel?: string; icon: typeof User }[] = [
  { id: "profile", label: "Профіль", icon: User },
  { id: "history", label: "Історія", headerLabel: "Історія досвіду", icon: History },
  { id: "top", label: "Топ", headerLabel: "Таблиця лідерів", icon: BarChart3 },
  { id: "calendar", label: "Календар", icon: Calendar },
]

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <>
      {/* Gradient blur fade behind the tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-32 bg-linear-to-t from-guild-bg-bottom via-guild-bg-bottom/70 to-transparent pointer-events-none" />

      {/* The actual tab bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)]">
        <nav className="glass-card-bottom-tabs rounded-full bg-guild-bg-bottom/80 backdrop-blur-xl">
          <div className="flex items-center justify-around py-2 px-2">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="flex flex-col items-center gap-0.5 py-1.5 px-6 -mx-3 rounded-[2rem] transition-colors"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${isActive ? "text-guild-tab-active" : "text-guild-tab-inactive"}`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${isActive ? "text-guild-tab-active" : "text-guild-tab-inactive"}`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
