import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layout } from "@/components/layout/layout.tsx"
import { PromotionsForm } from "@/components/promotions/promotions-form"
import { createPromotion } from "@/components/promotions/api/promotions.ts"
import { toast } from "sonner"

// PromotionFormData is inferred from the form's schema — grab it via the onSubmit callback param type
type FormData = Parameters<React.ComponentProps<typeof PromotionsForm>["onSubmit"]>[0]

export default function PromotionCreatePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: FormData) => {
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
            const promotion = await createPromotion(payload)
            toast.success("Промоакцію успішно створено")
            navigate(`/promotions/${promotion.promoId}`)
        } catch (error: any) {
            toast.error(error?.message || "Помилка при створенні промоакції")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Промоакції", path: "/promotions" }, { label: "Створити промоакцію", path: "/promotions/create" }]}>
            <div className="overflow-hidden">
                <PromotionsForm
                    mode="create"
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/promotions")}
                    isLoading={isLoading}
                />
            </div>
        </Layout>
    )
}
