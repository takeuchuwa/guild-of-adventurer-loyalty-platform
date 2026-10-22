"use client"

import { Layout } from "@/components/layout/layout"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { getMemberById } from "@/components/members/api/api"
import { toast } from "sonner"
import type { Member } from "@/components/members/types/member"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PointsLedgerTable } from "@/components/members/points-ledger-table"
import { MemberRail } from "@/components/members/member-rail"
import { MemberEditDialog } from "@/components/shared/dialogs/member-edit-dialog"
import { PointsAdjustmentWarningDialog } from "@/components/shared/dialogs/points-adjustment-warning-dialog"
import { PointsAdjustmentDialog } from "@/components/shared/dialogs/points-adjustment-dialog"

export default function MemberEditPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isFetching, setIsFetching] = useState(true)
    const [member, setMember] = useState<Member | null>(null)
    const [reloadLedger, setReloadLedger] = useState<(() => Promise<void>) | null>(null)

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [warningDialogOpen, setWarningDialogOpen] = useState(false)
    const [pointsDialogOpen, setPointsDialogOpen] = useState(false)

    const fetchMember = async () => {
        if (!id) {
            toast.error("ID авантюриста не знайдено")
            navigate("/members")
            return
        }

        setIsFetching(true)
        try {
            const data = await getMemberById(id)
            setMember(data)
        } catch (error) {
            console.error("Error fetching member:", error)
            toast.error("Помилка при завантаженні учасника")
            navigate("/members")
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        fetchMember()
    }, [id, navigate])

    const handlePointsAdjusted = async () => {
        await fetchMember()
        if (reloadLedger) {
            await reloadLedger()
        }
        toast.success("Бали учасника успішно оновлено")
    }

    const breadcrumbs = [
        { label: "Підкорювачі", path: "/members" },
        { label: "Редагування профілю", path: `/members/${id}` },
    ]

    if (isFetching) {
        return (
            <Layout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!member) {
        return null
    }

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[600px_1fr]">
                <div className="border-b border-[rgba(201,158,58,.14)] p-7 xl:border-r xl:border-b-0">
                    <MemberRail member={member} />
                </div>

                <div className="flex min-w-0 flex-col gap-5 p-7">
                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setWarningDialogOpen(true)}
                        >
                            Коригування балів вручну
                        </Button>
                        <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setEditDialogOpen(true)}>
                            Редагувати
                        </Button>
                    </div>

                    <PointsLedgerTable memberId={id!} onLoadLedger={setReloadLedger} />
                </div>
            </div>

            <MemberEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                member={member}
                onSuccess={fetchMember}
            />

            <PointsAdjustmentWarningDialog
                open={warningDialogOpen}
                onOpenChange={setWarningDialogOpen}
                onConfirm={() => {
                    setWarningDialogOpen(false)
                    setPointsDialogOpen(true)
                }}
            />

            <PointsAdjustmentDialog
                open={pointsDialogOpen}
                onOpenChange={setPointsDialogOpen}
                member={member}
                onSuccess={handlePointsAdjusted}
            />
        </Layout>
    )
}
