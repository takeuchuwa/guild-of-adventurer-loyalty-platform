import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { BottomSheet, SheetTitleRow } from "@/components/BottomSheet"
import { CategoryIcon } from "@/components/CategoryIcon"
import { axiosInstance } from "@/lib/api-utils"
import { useRawInitData } from "@tma.js/sdk-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative w-[44px] h-6 shrink-0 flex items-center box-border transition-colors ${
        on ? "border-2 border-guild-gold bg-guild-gold justify-end pr-[3px]" : "border border-guild-card-border justify-start pl-[3px]"
      }`}
    >
      <span className={`w-[18px] h-[18px] block transition-colors ${on ? "bg-guild-bg-bottom" : "bg-guild-text-muted"}`} />
    </span>
  )
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [notifications, setNotifications] = useState(true)
  const [leaderboardVisible, setLeaderboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const initDataRaw = useRawInitData()

  useEffect(() => {
    if (!isOpen || !initDataRaw) return

    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await axiosInstance.get("/members/@self/settings", {
          headers: { Authorization: `tma ${initDataRaw}` },
        })

        const settings = response.data.data || []

        const notifSetting = settings.find((s: any) => s.name === "notifications")
        setNotifications(notifSetting ? notifSetting.value === "true" : true)

        const leaderSetting = settings.find((s: any) => s.name === "leaderboard_visibility")
        setLeaderboardVisible(leaderSetting ? leaderSetting.value === "true" : false)

      } catch (err) {
        console.error("Failed to fetch settings", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [isOpen, initDataRaw])

  const saveSettings = async (updates: { name: string; value: string }[]) => {
    if (!initDataRaw) return

    setIsSaving(true)
    try {
      await axiosInstance.put("/members/@self/settings", updates, {
        headers: { Authorization: `tma ${initDataRaw}` },
      })
    } catch (err) {
      console.error("Failed to save settings", err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleNotifications = () => {
    const newVal = !notifications
    setNotifications(newVal)
    saveSettings([{ name: "notifications", value: String(newVal) }])
  }

  const toggleLeaderboard = () => {
    const newVal = !leaderboardVisible
    setLeaderboardVisible(newVal)
    saveSettings([{ name: "leaderboard_visibility", value: String(newVal) }])
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} header={<SheetTitleRow title="Налаштування" onClose={onClose} />}>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-guild-gold/50" />
        </div>
      ) : (
        <>
          {/* Notification Setting Item */}
          <button
            type="button"
            onClick={toggleNotifications}
            disabled={isSaving}
            className="w-full flex gap-3.5 items-start py-4 border-t border-guild-card-border text-left disabled:opacity-60"
          >
            <CategoryIcon shape="square" glyph="!" size={34} className="text-guild-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-base uppercase tracking-wide text-guild-text leading-tight">
                Дозволити сповіщення
              </h3>
              <p className="text-guild-text-muted text-[13px] mt-1.5 leading-relaxed">
                Отримуйте сповіщення про новий досвід та важливі події у Вежі.
              </p>
            </div>
            <Toggle on={notifications} />
          </button>

          {/* Privacy/Identity Setting Item */}
          <button
            type="button"
            onClick={toggleLeaderboard}
            disabled={isSaving}
            className="w-full flex gap-3.5 items-start py-4 border-t border-guild-card-border text-left disabled:opacity-60"
          >
            <CategoryIcon shape="square" glyph="ТОП" size={34} className="text-guild-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-base uppercase tracking-wide text-guild-text leading-tight">
                Показувати ім'я в таблиці лідерів
              </h3>
              <p className="text-guild-text-muted text-[13px] mt-1.5 leading-relaxed">
                За замовчуванням ви анонімні. Увімкніть, щоб інші бачили ваше справжнє ім'я.
              </p>
            </div>
            <Toggle on={leaderboardVisible} />
          </button>
        </>
      )}
    </BottomSheet>
  )
}
