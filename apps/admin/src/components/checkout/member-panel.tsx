"use client"

import { useEffect, useState, type FormEvent } from "react"
import InputMask from "react-input-mask"
import { Pencil, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Overline } from "@/components/ui/typography"
import { searchMembers } from "@/components/checkout/api/api"
import type { CartState } from "@/components/checkout/types/checkout"
import type { Member } from "@/components/members/types/member"

interface MemberPanelProps {
    /** The member currently on the cart, as the cart reports them. */
    member?: CartState["member"] | null
    onSelect: (member: Member) => void | Promise<void>
    onRemove: () => void | Promise<void>
    /** Surfaced from the hardware QR scanner, which attaches members too. */
    scanError?: string
}

/**
 * Member block at the head of the cart rail: who is being served, and the phone
 * search that puts them there. Lives beside the money it affects — the level
 * drives the discounts and the XP shown two blocks below.
 */
export function MemberPanel({ member, onSelect, onRemove, scanError }: MemberPanelProps) {
    const [search, setSearch] = useState("+380")
    const [results, setResults] = useState<Member[]>([])
    const [showResults, setShowResults] = useState(false)
    /** Set by the pencil — search while a member is already attached. */
    const [isEditing, setIsEditing] = useState(false)

    // A new member on the cart ends the search, whoever started it (pencil or scanner).
    useEffect(() => {
        setIsEditing(false)
        setShowResults(false)
        setResults([])
        setSearch("+380")
    }, [member?.memberId])

    const handleSearch = async (event?: FormEvent) => {
        event?.preventDefault()

        const cleanPhone = search.replace(/[^\d+]/g, "")

        if (cleanPhone.length < 4) {
            setResults([])
            setShowResults(false)
            return
        }

        const found = await searchMembers(cleanPhone)
        setResults(found)
        setShowResults(true)
    }

    const handleSelect = async (found: Member) => {
        setShowResults(false)
        await onSelect(found)
    }

    const memberInitial = (member?.name?.trim()?.[0] || "?").toUpperCase()
    const isSearchOpen = !member || isEditing

    return (
        <div className="flex flex-col gap-3 border-b border-[rgba(201,158,58,.16)] px-6 py-5">
            {member && (
                <div className="flex items-center gap-3.5">
                    <span className="font-heading text-primary flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(201,158,58,.45)] text-[16px]">
                        {memberInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{member.name}</div>
                        <div className="text-foreground/55 mt-0.5 text-[12.5px]">
                            {member.levelName ? `${member.levelName} · ` : ""}
                            <span className="font-mono">{member.pointsBalance}</span> балів
                            {member.phone ? <span className="font-mono"> · {member.phone}</span> : null}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-[34px] cursor-pointer border-[rgba(237,230,216,.18)] px-0"
                            onClick={() => setIsEditing((prev) => !prev)}
                            aria-label="Змінити учасника"
                            title="Змінити учасника"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="destructiveOutline"
                            size="sm"
                            className="h-8 w-[34px] cursor-pointer px-0"
                            onClick={onRemove}
                            aria-label="Прибрати учасника"
                            title="Прибрати учасника"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {isSearchOpen && (
                <div className="relative">
                    {!member && <Overline className="mb-2.5">Учасник</Overline>}

                    <form onSubmit={handleSearch} className="relative">
                        {/* @ts-ignore - React 18 type mismatch */}
                        <InputMask
                            mask="+38 (099) 999-99-99"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onPaste={(e) => {
                                e.preventDefault()
                                const pastedText = e.clipboardData.getData("text")
                                const digits = pastedText.replace(/\D/g, "")

                                let targetDigits = digits
                                if (targetDigits.startsWith("380") && targetDigits.length >= 12) {
                                    targetDigits = targetDigits.slice(2)
                                } else if (targetDigits.startsWith("80") && targetDigits.length >= 11) {
                                    targetDigits = targetDigits.slice(1)
                                }

                                // pad or slice to max 10 digits
                                if (targetDigits.length > 10) {
                                    targetDigits = targetDigits.slice(0, 10)
                                }

                                if (targetDigits.length > 0) {
                                    // We format manually to match the mask
                                    let formatted = "+38 ("
                                    if (targetDigits.length > 0) formatted += targetDigits.slice(0, 3)
                                    if (targetDigits.length >= 3) formatted += ") "
                                    if (targetDigits.length > 3) formatted += targetDigits.slice(3, 6)
                                    if (targetDigits.length >= 6) formatted += "-"
                                    if (targetDigits.length > 6) formatted += targetDigits.slice(6, 8)
                                    if (targetDigits.length >= 8) formatted += "-"
                                    if (targetDigits.length > 8) formatted += targetDigits.slice(8, 10)

                                    setSearch(formatted)
                                    setTimeout(() => {
                                        const input = e.target as HTMLInputElement
                                        const pos = formatted.length
                                        input.setSelectionRange(pos, pos)
                                    }, 0)
                                }
                            }}
                            placeholder="Пошук за номером телефону"
                            className="bg-surface border-input placeholder:text-foreground/40 h-[42px] w-full border pr-11 pl-3.5 font-mono text-[13px] outline-none focus-visible:border-primary focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-primary"
                        />
                        <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-primary absolute top-0 right-0 h-[42px] cursor-pointer px-3 hover:bg-transparent"
                            aria-label="Знайти учасника"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    {showResults && (
                        <div className="bg-surface border-hairline absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border">
                            {results.length === 0 ? (
                                <p className="text-muted-foreground px-4 py-3 text-[13.5px]">Учасника не знайдено</p>
                            ) : (
                                results.map((found) => (
                                    <button
                                        key={found.memberId}
                                        type="button"
                                        className="hover:bg-accent w-full cursor-pointer px-4 py-2.5 text-left transition-colors"
                                        onClick={() => handleSelect(found)}
                                    >
                                        <p className="font-medium">
                                            {found.firstName} {found.lastName}
                                        </p>
                                        <p className="text-foreground/50 font-mono text-[11px]">
                                            {found.phone} • {found.pointsBalance} балів
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {scanError && (
                <div className="text-destructive border border-[rgba(126,43,33,.6)] p-2 text-[13px]">{scanError}</div>
            )}
        </div>
    )
}
