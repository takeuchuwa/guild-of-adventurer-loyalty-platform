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

  // Global tap feedback: a soft translucent gold wash that fades in and out
  // (replaces the old ripple; kept subtle so it never flashes bright/white).
  useEffect(() => {
    const TAP_MS = 120
    const FADE_OUT_MS = 160
    const ACTIVE_OPACITY = 0.18
    const MOVE_THRESHOLD = 10

    const handlePointerDown = (e: PointerEvent) => {
      let target = (e.target as HTMLElement).closest<HTMLElement>(".glass-card, [data-tap]")
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

      const overlay = document.createElement("span")
      overlay.className = "tap-invert"
      target.appendChild(overlay)
      requestAnimationFrame(() => {
        overlay.style.opacity = String(ACTIVE_OPACITY)
      })

      let isRemoved = false
      const removeOverlay = () => {
        if (isRemoved) return
        isRemoved = true
        overlay.style.opacity = "0"
        setTimeout(() => {
          if (overlay.parentNode === target) {
            target.removeChild(overlay)
          }
        }, FADE_OUT_MS)
        cleanup()
      }

      const handlePointerMove = (moveEv: PointerEvent) => {
        const dx = Math.abs(moveEv.clientX - e.clientX)
        const dy = Math.abs(moveEv.clientY - e.clientY)
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          removeOverlay()
        }
      }

      const cleanup = () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", removeOverlay)
        document.removeEventListener("pointercancel", removeOverlay)
      }

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", removeOverlay)
      document.addEventListener("pointercancel", removeOverlay)

      setTimeout(removeOverlay, TAP_MS)
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
