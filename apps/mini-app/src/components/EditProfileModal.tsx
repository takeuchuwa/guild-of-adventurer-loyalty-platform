import { useState, useEffect, useRef } from "react"
import { X, Loader2, Calendar, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { axiosInstance } from "@/lib/api-utils"
import { useRawInitData } from "@tma.js/sdk-react"
import { uk } from "date-fns/locale"
import type { Member } from "@/types/member"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  onSuccess: () => void
}

function convertUnixToDateString(unix: number | null): string {
  if (!unix) return ""
  const date = new Date(unix * 1000)
  const d = String(date.getUTCDate()).padStart(2, "0")
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const y = date.getUTCFullYear()
  return `${d}.${m}.${y}`
}

function parseDateStringToUnix(dateStr: string): number | null {
  const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/
  const match = dateStr.match(regex)
  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))

  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day ||
    dateObj.getTime() > Date.now()
  ) {
    return null
  }
  return Math.floor(dateObj.getTime() / 1000)
}

export function EditProfileModal({ isOpen, onClose, member, onSuccess }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [nickname, setNickname] = useState("")
  const [birthDate, setBirthDate] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isRendered, setIsRendered] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

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
    if (isOpen && member) {
      setFirstName(member.firstName || "")
      setLastName(member.lastName || "")
      setNickname(member.nickname || "")
      setBirthDate(convertUnixToDateString(member.birthDate))
      setError(null)
    }
  }, [isOpen, member])

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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      if (scrollRef.current) {
        const containerRect = scrollRef.current.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        
        const relativeTop = targetRect.top - containerRect.top + scrollRef.current.scrollTop
        const centerOffset = (containerRect.height / 2) - (targetRect.height / 2)
        
        scrollRef.current.scrollTo({
          top: relativeTop - centerOffset,
          behavior: 'smooth'
        })
      } else {
         target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350)
  }

  const handleSave = async () => {
    if (!initDataRaw) return

    if (!firstName.trim()) {
      setError("Ім'я обов'язкове")
      return
    }

    let parsedDate: number | null = null
    if (birthDate.trim()) {
      parsedDate = parseDateStringToUnix(birthDate)
      if (!parsedDate) {
        setError("Невірний формат дати. Використовуйте ДД.ММ.РРРР та реальну дату.")
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      await axiosInstance.put("/members/@self", {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        nickname: nickname.trim() || null,
        birthDate: parsedDate
      }, {
        headers: { Authorization: `tma ${initDataRaw}` },
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      let msg = err.response?.data?.message || err.message || "Failed to update profile"
      if (err.response?.data?.error === "VALIDATION_ERROR" && Array.isArray(err.response?.data?.details)) {
        msg = err.response.data.details[0]?.message || msg
      }
      setError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const getBirthDateAsDate = () => {
    if (!birthDate) return undefined;
    const match = birthDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return undefined;
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const y = parseInt(match[3], 10);
    const date = new Date(y, m, d);
    if (isNaN(date.getTime())) return undefined;
    return date;
  }

  if (!isRendered) return null

  return (
    <>
      <div
        className={`modal-overlay ${isClosing ? 'animate-fadeOut' : ''}`}
        onClick={onClose}
      />

      <div
        ref={scrollRef}
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
              Редагувати профіль
            </h1>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200"
            >
              <X className="w-5 h-5 text-guild-text-muted" />
            </button>
          </header>

          {/* Content Area */}
          <div className="px-6 space-y-6 flex-1 pb-4">

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 bg-guild-negative/10 border border-guild-negative/20 text-guild-negative rounded-xl p-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="block text-guild-text-muted font-bold text-xs uppercase tracking-widest pl-1">Ім'я (обов'язково)</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Введіть ваше ім'я"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onFocus={handleFocus}
                    maxLength={32}
                    className="w-full h-14 px-5 bg-black/20 border-none rounded-2xl text-guild-text placeholder:text-guild-text-muted/50 focus:ring-2 focus:ring-guild-gold/50 transition-all outline-none"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-guild-gold/30 transition-colors"></div>
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="block text-guild-text-muted font-bold text-xs uppercase tracking-widest pl-1">Прізвище</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Введіть ваше прізвище"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onFocus={handleFocus}
                    maxLength={32}
                    className="w-full h-14 px-5 bg-black/20 border-none rounded-2xl text-guild-text placeholder:text-guild-text-muted/50 focus:ring-2 focus:ring-guild-gold/50 transition-all outline-none"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-guild-gold/30 transition-colors"></div>
                </div>
              </div>

              {/* Nickname */}
              <div className="space-y-2">
                <label className="block text-guild-text-muted font-bold text-xs uppercase tracking-widest pl-1">Псевдонім</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Ваш псевдонім у Гільдії"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onFocus={handleFocus}
                    maxLength={32}
                    className="w-full h-14 px-5 bg-black/20 border-none rounded-2xl text-guild-text placeholder:text-guild-text-muted/50 focus:ring-2 focus:ring-guild-gold/50 transition-all outline-none"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-guild-gold/30 transition-colors"></div>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-3 pb-4">
                <label className="block text-guild-text-muted font-bold text-xs uppercase tracking-widest pl-1">Дата народження</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="ДД.ММ.РРРР"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    onFocus={handleFocus}
                    className="w-full h-14 px-5 bg-black/20 border-none rounded-2xl text-guild-text placeholder:text-guild-text-muted/50 focus:ring-2 focus:ring-guild-gold/50 transition-all outline-none font-mono"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  />
                  <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none group-focus-within:border-guild-gold/30 transition-colors"></div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        type="button" 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                      >
                        <Calendar className="w-5 h-5 text-guild-text-muted/50 group-focus-within:text-guild-gold/50 transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100] bg-[#172e27]/95 backdrop-blur-3xl border-[#c8a679]/20 rounded-[1.5rem] shadow-2xl" align="end" sideOffset={12}>
                      <ShadcnCalendar
                        mode="single"
                        selected={getBirthDateAsDate()}
                        defaultMonth={getBirthDateAsDate()}
                        onSelect={(date) => {
                          if (date) {
                            const d = String(date.getDate()).padStart(2, "0");
                            const m = String(date.getMonth() + 1).padStart(2, "0");
                            const y = date.getFullYear();
                            setBirthDate(`${d}.${m}.${y}`);
                          }
                        }}
                        initialFocus
                        locale={uk}
                        captionLayout="dropdown"
                        startMonth={new Date(1920, 0)}
                        endMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>

                </div>
                {/* Warning Note */}
                <div className="flex items-start gap-3 px-3 py-3 bg-guild-gold/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-guild-gold mt-0.5 shrink-0" />
                  <p className="text-guild-gold font-medium text-[11px] leading-relaxed">
                    Дату народження можна змінити лише один раз на рік. В іншому випадку зверніться до адміністратора.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-6 pt-4 border-white/5 rounded-b-[2.5rem] flex flex-col space-y-3 z-10 relative mt-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 rounded-full bg-linear-to-r from-guild-gold to-guild-gold-light text-black font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-guild-gold/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:scale-100"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Збереження...
                </>
              ) : (
                "Зберегти"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full py-4 rounded-full text-guild-text-muted font-semibold text-sm hover:bg-white/5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100"
            >
              Скасувати
            </button>
          </footer>
        </div>
      </div>
    </>
  )
}
