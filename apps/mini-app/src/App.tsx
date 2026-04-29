import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { BottomTabs, tabs, type TabId } from "@/components/BottomTabs"
import { ReferralModal } from "@/components/ReferralModal"
import { HelpModal } from "@/components/HelpModal"
import { ProfileTab } from "@/tabs/ProfileTab"
import { HistoryTab } from "@/tabs/HistoryTab"
import { TopTab } from "@/tabs/TopTab"
import { CalendarTab } from "@/tabs/CalendarTab"
import { mockMember } from "@/data/member"

function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get("tab") as TabId
    return tabs.some((t) => t.id === tabParam) ? tabParam : "profile"
  })
  const [referralOpen, setReferralOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.replaceState({}, "", url)
  }, [activeTab])

  // Global Ripple Effect
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      let target = (e.target as HTMLElement).closest<HTMLElement>(".glass-card, [data-ripple]")
      if (!target) {
        target = (e.target as HTMLElement).closest<HTMLElement>("button")
      }
      if (!target) return

      const style = getComputedStyle(target)
      if (style.position === "static") {
        target.style.position = "relative"
      }
      if (style.overflow !== "hidden") {
        target.style.overflow = "hidden"
      }

      const rect = target.getBoundingClientRect()
      const size = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2;
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const ripple = document.createElement("span")
      ripple.className = "ripple-effect"
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      let isRemoved = false
      let isAppended = false

      const removeRipple = () => {
        if (!isRemoved) {
          isRemoved = true
          if (isAppended && ripple.parentNode === target) {
            target.removeChild(ripple)
          }
        }
      }

      const appendTimeout = setTimeout(() => {
        if (!isRemoved) {
          target.appendChild(ripple)
          isAppended = true
        }
      }, 75)

      const handlePointerMove = (moveEv: PointerEvent) => {
        const dx = Math.abs(moveEv.clientX - e.clientX)
        const dy = Math.abs(moveEv.clientY - e.clientY)
        if (dx > 10 || dy > 10) {
          clearTimeout(appendTimeout)
          removeRipple()
          cleanup()
        }
      }

      const handlePointerUp = () => {
        if (!isRemoved && !isAppended) {
          clearTimeout(appendTimeout)
          target.appendChild(ripple)
          isAppended = true
        }
        cleanup()
      }

      const cleanupCancel = () => {
        clearTimeout(appendTimeout)
        removeRipple()
        cleanup()
      }

      const cleanup = () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerUp)
        document.removeEventListener("pointercancel", cleanupCancel)
      }

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
      document.addEventListener("pointercancel", cleanupCancel)

      setTimeout(() => {
        removeRipple()
        cleanup()
      }, 1200)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])


  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />
      case "history":
        return <HistoryTab />
      case "top":
        return <TopTab />
      case "calendar":
        return <CalendarTab />
    }
  }

  return (
    <div className="main-screen">
      <Header
        onInviteClick={() => setReferralOpen(true)}
        onMenuClick={() => setHelpOpen(true)}
      />

      {/* Tab content */}
      <main className="flex-1 pt-2 pb-2">
        {renderTab()}
      </main>

      <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <ReferralModal
        isOpen={referralOpen}
        onClose={() => setReferralOpen(false)}
        memberId={mockMember.memberId}
      />

      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  )
}

export default App
