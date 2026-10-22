"use client"

import type { CustomColumnDef } from "@/types/table"
import type { Member } from "@/components/members/types/member"
import { Link } from "react-router-dom";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLevels } from "@/hooks/use-levels";

function initialOf(member: Member) {
    return (member.firstName?.trim()?.[0] || member.lastName?.trim()?.[0] || "?").toUpperCase()
}

/** Gold-hairline circle with the member's initial — the one round element in the table. */
function MemberAvatar({ member }: { member: Member }) {
    return (
        <span className="font-heading flex size-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(201,158,58,.35)] text-[13px] text-primary">
            {initialOf(member)}
        </span>
    )
}

function LevelBadge({ member }: { member: Member }) {
    const { getProgress } = useLevels()
    const { level, ordinal } = getProgress(member.levelId, member.pointsBalance)

    if (!ordinal) return <span className="text-foreground/30 font-mono text-[13px]">—</span>

    return (
        <span
            className="text-accent-bright inline-flex max-w-full items-center gap-1.5 border border-[rgba(201,158,58,.45)] px-2 py-[3px] text-[12px]"
            title={`Рівень ${ordinal}${level?.name ? ` — ${level.name}` : ""}`}
        >
            {level?.name ? (
                <>
                    <span className="truncate">{level.name}</span>
                    <span className="text-accent-bright/60 shrink-0 font-mono">(lvl {ordinal})</span>
                </>
            ) : (
                <span className="font-mono">lvl {ordinal}</span>
            )}
        </span>
    )
}

/** XP value with a 3px bar showing progress toward the next level. */
function ExperienceCell({ member }: { member: Member }) {
    const { getProgress } = useLevels()
    const { nextLevel, progress } = getProgress(member.levelId, member.pointsBalance)

    return (
        <div className="flex flex-col gap-1.5 pr-6">
            <span className="font-mono text-[13px]">
                {member.pointsBalance.toLocaleString("uk-UA")}
                {nextLevel ? (
                    <span className="text-foreground/40"> / {nextLevel.minPoints.toLocaleString("uk-UA")}</span>
                ) : null}
            </span>
            <span className="block h-[3px] w-full bg-[rgba(237,230,216,.12)]">
                <span className="bg-primary block h-[3px]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
        </div>
    )
}

export const memberColumns: CustomColumnDef<Member>[] = [
    {
        id: "firstName",
        header: "Ім'я",
        accessorFn: (row) => {
            const first = row.firstName ?? ""
            const last = row.lastName ?? ""
            return `${first} ${last}`.trim()
        },
        cell: ({ row, table }) => {
            const member = row.original
            const isDialog = (table.options.meta as any)?.isDialog
            if (isDialog) {
                return (
                    <div className="flex items-center gap-2.5">
                        <MemberAvatar member={member} />
                        <span className="font-semibold text-foreground">
                            {member.firstName} {member.lastName}
                        </span>
                        <a
                            href={`/members/${member.memberId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                            data-no-select="true"
                            title="Відкрити профіль учасника в новій вкладці"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )
            }
            return (
                <div className="flex items-center gap-3">
                    <MemberAvatar member={member} />
                    <Link
                        to={`/members/${member.memberId}`}
                        className="truncate font-semibold text-foreground transition-colors hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {member.firstName} {member.lastName}
                    </Link>
                </div>
            )
        },
        enableSorting: false,
        size: 22,
    },
    {
        id: "phone",
        header: "Телефон",
        accessorKey: "phone",
        cell: ({ row }) => {
            const phone = row.original.phone
            if (!phone) return null

            return (
                <div
                    className="text-foreground/68 flex cursor-pointer items-center gap-2 font-mono text-[13px] transition-colors hover:text-primary"
                    onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(phone)
                        toast.success("Номер телефону скопійовано")
                    }}
                    title="Скопіювати"
                >
                    {phone}
                    <Copy className="h-3 w-3 text-muted-foreground opacity-50 transition-opacity hover:opacity-100" />
                </div>
            )
        },
        enableSorting: false,
        size: 15,
        minSize: 15,
    },
    {
        id: "levelId",
        header: "Рівень",
        accessorKey: "levelId",
        // Names need more room than the old «lvl N» badge did.
        minSize: 12,
        size: 14,
        cell: ({ row }) => <LevelBadge member={row.original} />,
    },
    {
        id: "pointsBalance",
        header: "Досвід",
        accessorKey: "pointsBalance",
        size: 14,
        minSize: 12,
        cell: ({ row }) => <ExperienceCell member={row.original} />,
    },
    {
        id: "referredBy",
        header: "Запросив",
        accessorFn: (row) => {
            if (!row.referredByMember?.memberId) return "—"
            const first = row.referredByMember.firstName ?? ""
            const last = row.referredByMember.lastName ?? ""
            return `${first} ${last}`.trim() || "—"
        },
        cell: ({ row, table }) => {
            const referrer = row.original.referredByMember
            if (!referrer?.memberId) {
                return <div className="text-foreground/30 font-mono">—</div>
            }

            const name = `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() || "Невідомий"
            const isDialog = (table.options.meta as any)?.isDialog

            if (isDialog) {
                return (
                    <span className="font-semibold text-foreground">
                        {name}
                    </span>
                )
            }

            return (
                <Link
                    to={`/members/${referrer.memberId}`}
                    className="text-foreground/70 transition-colors hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                >
                    {name}
                </Link>
            )
        },
        enableSorting: false,
        size: 18,
    },
]
