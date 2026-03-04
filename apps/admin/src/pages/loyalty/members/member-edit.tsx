"use client"

import { Layout } from "@/components/layout/layout"
import { MemberForm } from "@/components/members/member-form"
import type { MemberFormData } from "@/components/members/member-form"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { getMemberById, updateMember } from "@/components/members/api/api"
import { toast } from "sonner"
import type { Member } from "@/components/members/types/member"
import { Loader2 } from "lucide-react"
import { PointsLedgerTable } from "@/components/members/points-ledger-table"
import { LevelInfoCard } from "@/components/members/level-info-card"

export default function MemberEditPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [member, setMember] = useState<Member | null>(null)
    const [reloadLedger, setReloadLedger] = useState<(() => Promise<void>) | null>(null)

    const fetchMember = async () => {
        if (!id) {
            toast.error("ID учасника не знайдено")
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

    const handleSubmit = async (data: MemberFormData) => {
        if (!id) return

        setIsLoading(true)
        try {
            await updateMember(id, data)
            toast.success("Профіль учасника успішно оновлено")
            navigate("/members")
        } catch (error) {
            console.error("Error updating member:", error)
            const errorMessage = error instanceof Error ? error.message : "Помилка при оновленні учасника"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePointsAdjusted = async () => {
        await fetchMember()
        if (reloadLedger) {
            await reloadLedger()
        }
        toast.success("Бали учасника успішно оновлено")
    }

    const handleCancel = () => {
        navigate("/members")
    }

    if (isFetching) {
        return (
            <Layout
                breadcrumbs={[
                    { label: "Учасники", path: "/members" },
                    { label: "Редагувати учасника", path: `/members/${id}` },
                ]}
            >
                <div className="container mx-auto py-10 max-w-2xl">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </div>
            </Layout>
        )
    }

    if (!member) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[
                { label: "Учасники", path: "/members" },
                { label: "Редагувати учасника", path: `/members/${id}` },
            ]}
        >
            <div className="container mx-auto py-10 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Редагувати учасника</h1>
                    <p className="text-muted-foreground mt-2">Оновіть інформацію про учасника</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
                    <div className="flex flex-col gap-6">
                        <div className="bg-card border rounded-lg p-6">
                            <MemberForm
                                initialData={member}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                onPointsAdjusted={handlePointsAdjusted}
                                isLoading={isLoading}
                            />
                        </div>

                        <div className="bg-card border rounded-lg p-6">
                            <PointsLedgerTable memberId={id!} onLoadLedger={setReloadLedger} />
                        </div>
                    </div>

                    <div>
                        <LevelInfoCard memberId={id!} />
                    </div>
                </div>
            </div>
        </Layout>
    )
}
