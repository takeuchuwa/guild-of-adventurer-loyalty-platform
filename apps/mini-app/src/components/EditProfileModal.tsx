import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { BottomSheet, SheetTitleRow } from "@/components/BottomSheet"
import { CategoryIcon } from "@/components/CategoryIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { axiosInstance } from "@/lib/api-utils"
import { useRawInitData } from "@tma.js/sdk-react"
import { uk } from "date-fns/locale"
import type { Member } from "@/types/member"

// Calendar glyph: box + top rail + two ticks, per the sheet icon spec.
function CalendarGlyph({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className}>
      <rect x="1" y="3" width="18" height="16" fill="none" stroke="currentColor" strokeWidth={2} />
      <line x1="1" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth={2} />
      <line x1="6" y1="1" x2="6" y2="5" stroke="currentColor" strokeWidth={2} />
      <line x1="14" y1="1" x2="14" y2="5" stroke="currentColor" strokeWidth={2} />
    </svg>
  )
}

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

  const scrollRef = useRef<HTMLDivElement>(null)

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

  const fieldClass =
    "w-full h-12 min-h-11 px-3.5 bg-transparent border border-guild-card-border text-guild-text placeholder:text-guild-text-dim outline-none transition-colors group-focus-within:border-2 group-focus-within:border-guild-gold"

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      contentRef={scrollRef}
      header={<SheetTitleRow title="Редагувати профіль" onClose={onClose} />}
      footer={
        <div className="flex flex-col shrink-0 mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-[52px] bg-guild-gold text-guild-bg-bottom font-heading font-semibold text-[17px] flex items-center justify-center gap-2 uppercase tracking-[0.1em] active:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Збереження...
              </>
            ) : (
              "Зберегти"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full h-12 font-mono text-xs tracking-wider uppercase text-guild-text-muted disabled:opacity-50"
          >
            Скасувати
          </button>
        </div>
      }
    >
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 border border-guild-negative/40 text-guild-negative p-3 text-sm mb-4">
          <CategoryIcon shape="triangle" glyph="!" size={20} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* First Name */}
      <div className="group mb-3.5">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase block mb-2 text-guild-text-muted group-focus-within:text-guild-gold transition-colors">
          Ім'я (обов'язково)
        </span>
        <input
          type="text"
          placeholder="Введіть ваше ім'я"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onFocus={handleFocus}
          maxLength={32}
          className={fieldClass}
        />
      </div>

      {/* Last Name */}
      <div className="group mb-3.5">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase block mb-2 text-guild-text-muted group-focus-within:text-guild-gold transition-colors">
          Прізвище
        </span>
        <input
          type="text"
          placeholder="Введіть ваше прізвище"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onFocus={handleFocus}
          maxLength={32}
          className={fieldClass}
        />
      </div>

      {/* Nickname */}
      <div className="group mb-3.5">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase block mb-2 text-guild-text-muted group-focus-within:text-guild-gold transition-colors">
          Псевдонім
        </span>
        <input
          type="text"
          placeholder="Ваш псевдонім у Вежі"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onFocus={handleFocus}
          maxLength={32}
          className={fieldClass}
        />
      </div>

      {/* Date of Birth */}
      <div className="group mb-3.5">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase block mb-2 text-guild-text-muted group-focus-within:text-guild-gold transition-colors">
          Дата народження
        </span>
        <div className="relative">
          <input
            type="text"
            placeholder="ДД.ММ.РРРР"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            onFocus={handleFocus}
            className={`${fieldClass} font-mono pr-11`}
          />
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-guild-text-muted transition-colors"
              >
                <CalendarGlyph className="text-guild-gold/70" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-100" align="end" sideOffset={12}>
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
        <div className="flex items-start gap-3 border border-guild-gold/45 px-3.5 py-3 mt-3">
          <span
            className="shrink-0 mt-[3px]"
            style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: "15px solid var(--color-guild-gold)" }}
          />
          <p className="text-guild-text/90 text-[13px] leading-relaxed">
            Дату народження можна змінити лише один раз на рік. В іншому випадку зверніться до адміністратора.
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}
