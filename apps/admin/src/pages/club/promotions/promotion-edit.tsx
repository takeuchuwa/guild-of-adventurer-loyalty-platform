import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Layout } from "@/components/layout/layout.tsx"
import { PromotionsForm } from "@/components/promotions/promotions-form"
import {
    getPromotionById,
    updatePromotion,
} from "@/components/promotions/api/promotions.ts"
import type { PromotionAssignment } from "@/components/promotions/assignments-panel"
import type { Promotion } from "@/components/promotions/types/promotion.ts"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type FormData = Parameters<React.ComponentProps<typeof PromotionsForm>["onSubmit"]>[0]

export default function PromotionEditPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [promotion, setPromotion] = useState<Promotion | null>(null)
    const [isFetching, setIsFetching] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!id) return
        setIsFetching(true)
        getPromotionById(id)
            .then(setPromotion)
            .catch((error: any) => {
                toast.error(error?.message || "Не вдалося завантажити промоакцію")
                navigate("/promotions")
            })
            .finally(() => setIsFetching(false))
    }, [id, navigate])

    const handleSubmit = async (data: FormData) => {
        if (!id) return

        const payload = {
            name: data.name,
            mode: data.mode,
            code: data.code || null,
            description: data.description,
            active: data.active,
            combinable: data.combinable,
            priority: data.priority ?? 0,
            usageRemaining: data.usageRemaining ?? null,
            startDate: data.startDate,
            endDate: data.endDate,
            config: data.config,
            assignments: data.assignments,
            levelAssignments: data.levelAssignments,
        }

        setIsLoading(true)
        try {
            await updatePromotion(id, payload)
            toast.success("Промоакцію успішно оновлено")
            navigate("/promotions")
        } catch (error: any) {
            toast.error(error?.message || "Помилка при оновленні промоакції")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Промоакції", path: "/promotions" }, { label: "Редагувати промоакцію", path: `/promotions/${id}` }]}>
            <div className="overflow-hidden">
                {isFetching ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : promotion ? (
                    <PromotionsForm
                        mode="edit"
                        initialData={{
                            name: promotion.name,
                            description: promotion.description ?? undefined,
                            active: promotion.active,
                            combinable: promotion.combinable,
                            mode: promotion.mode,
                            code: promotion.code ?? undefined,
                            priority: promotion.priority,
                            usageRemaining: promotion.usageRemaining,
                            startDate: promotion.startDate,
                            endDate: promotion.endDate,
                            config: promotion.config,
                            assignments: {
                                memberIds: (promotion as any).assignments?.map((a: any) => a.memberId) ?? [],
                                generateUniqueCodes: !!((promotion as any).assignments?.[0]?.uniqueCode),
                            },
                            levelAssignments: (promotion as any).levelAssignments ?? [],
                        }}
                        existingAssignments={(promotion as any).assignments as PromotionAssignment[] | undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate("/promotions")}
                        isLoading={isLoading}
                    />
                ) : null}
            </div>
        </Layout>
    )
}
