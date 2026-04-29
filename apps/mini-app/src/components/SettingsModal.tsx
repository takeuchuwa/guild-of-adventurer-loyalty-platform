import { useState, useEffect } from "react"
import { X, Bell, BellOff, Eye, EyeOff, Loader2 } from "lucide-react"
import { axiosInstance } from "@/lib/api-utils"
import { useRawInitData } from "@tma.js/sdk-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [notifications, setNotifications] = useState(true)
  const [leaderboardVisible, setLeaderboardVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isRendered, setIsRendered] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsClosing(false)
    } else if (isRendered) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setIsRendered(false)
        setIsClosing(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isRendered])

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

  // Absolutely Bulletproof iOS Tab Scroll Lock
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isRendered) return null

  return (
    <>
      <div
        className={`modal-overlay ${isClosing ? 'animate-fadeOut' : ''}`}
        onClick={onClose}
      />

      <div
        className={`modal-content flex flex-col overscroll-y-none ${isClosing ? 'animate-slideDown' : ''}`}
        onClick={onClose}
      >
        <div className="flex-1 shrink-0 min-h-32 cursor-pointer" onClick={onClose} />
        <div
          className="w-full bg-guild-modal-bg rounded-t-[2.5rem] shadow-2xl flex flex-col relative border-t border-white/5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* Header */}
          <header className="flex items-center justify-between px-6 py-2 pb-4">
            <h1 className="text-guild-gold font-bold text-xl tracking-tight">
              Налаштування
            </h1>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200"
            >
              <X className="w-5 h-5 text-guild-text-muted" />
            </button>
          </header>

          {/* Content Area */}
          <div className="px-6 space-y-6 flex-1 pb-10">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-guild-gold/50" />
              </div>
            ) : (
              <>
                {/* Notification Setting Item */}
                <div
                  className="relative group p-5 cursor-pointer rounded-2xl bg-black/20 border border-white/5 transition-colors hover:border-guild-gold/30"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  onClick={toggleNotifications}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${notifications ? 'bg-guild-gold/20 border-guild-gold/20' : 'bg-white/5 border-white/10'}`}>
                      {notifications ? (
                        <Bell className="w-6 h-6 text-guild-gold" fill="currentColor" />
                      ) : (
                        <BellOff className="w-6 h-6 text-white/70" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-guild-text leading-tight">Дозволити сповіщення</h3>
                        {/* React Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNotifications()
                          }}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border shadow-inner transition-colors duration-200 focus:outline-none disabled:pointer-events-none ${notifications ? 'bg-guild-gold border-guild-gold/50' : 'bg-black/40 border-white/5'}`}
                        >
                          <div className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${notifications ? 'translate-x-[26px] bg-white' : 'translate-x-[2px] bg-white/50'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-guild-text-muted leading-relaxed mt-1">
                        Отримуйте сповіщення про новий досвід та важливі події у Гільдії.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy/Identity Setting Item */}
                <div
                  className="relative group p-5 cursor-pointer rounded-2xl bg-black/20 border border-white/5 transition-colors hover:border-guild-gold/30"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  onClick={toggleLeaderboard}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${leaderboardVisible ? 'bg-[#a6cfbf]/20 border-[#a6cfbf]/20' : 'bg-white/5 border-white/10'}`}>
                      {leaderboardVisible ? (
                        <Eye className="w-6 h-6 text-[#a6cfbf]" />
                      ) : (
                        <EyeOff className="w-6 h-6 text-white/70" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-guild-text leading-tight pr-4">Показувати моє ім'я в таблиці лідерів</h3>
                        {/* React Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLeaderboard()
                          }}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border shadow-inner transition-colors duration-200 focus:outline-none disabled:pointer-events-none ${leaderboardVisible ? 'bg-guild-gold border-guild-gold/50' : 'bg-black/40 border-white/5'}`}
                        >
                          <div className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${leaderboardVisible ? 'translate-x-[26px] bg-white' : 'translate-x-[2px] bg-white/50'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-guild-text-muted leading-relaxed mt-1">
                        За замовчуванням ви анонімні. Увімкніть, щоб відображати ваше реальне ім'я іншим учасникам.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
