"use client"

import type {CustomColumnDef} from "@/types/table"
import type {Member} from "@/components/members/types/member"
import {Link} from "react-router-dom";

export const memberColumns: CustomColumnDef<Member>[] = [
    {
        id: "firstName",
        header: "Ім'я",
        accessorFn: (row) => {
            const first = row.firstName ?? ""
            const last = row.lastName ?? ""
            return `${first} ${last}`.trim()
        },
        cell: ({row}) => {
            const member = row.original
            return (
                <div>
                    <Link
                        to={`/members/${member.memberId}`}
                        className="hover:underline text-primary"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {member.firstName} {member.lastName}
                    </Link>
                </div>
            )
        },
        enableSorting: false,
        size: 20,
    },
    {
        id: "phone",
        header: "Телефон",
        accessorKey: "phone",
        enableSorting: false,
        size: 15,
        minSize: 15,
    },
    {
        id: "levelId",
        header: "Рівень",
        accessorKey: "levelId",
        minSize: 10,
        size: 10,
    },
    {
        id: "pointsBalance",
        header: "Досвід",
        accessorKey: "pointsBalance",
        size: 10,
        minSize: 10,
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
        cell: ({ row }) => {
            const referrer = row.original.referredByMember
            if (!referrer?.memberId) {
                return <div
                    className="text-primary font-normal h-5 w-48 justify-start"
                >
                    —
                </div>
            }

            const name = `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() || "Невідомий"

            return (
                <Link
                    to={`/members/${referrer.memberId}`}
                    className="hover:underline text-primary"
                    onClick={(e) => e.stopPropagation()}
                >
                    {name}
                </Link>
            )
        },
        enableSorting: false,
        size: 20,
    },
]
