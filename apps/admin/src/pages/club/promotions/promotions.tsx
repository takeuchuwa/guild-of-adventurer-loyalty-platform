"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { PromotionsTable } from "@/components/promotions/promotions-table.tsx"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import type { UseSearchOptions } from "@/hooks/use-search.tsx"
import type { Promotion } from "@/components/promotions/types/promotion.ts"
import { promotionsColumns } from "@/components/promotions/columns/columns.tsx"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useMemo } from "react"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deletePromotion } from "@/components/promotions/api/promotions.ts"
import { toast } from "sonner"
import { PromoFilter } from "@/components/shared/filters/promo-filter"

export default function PromotionsPage() {
    const searchProperties: UseSearchOptions = {
        baseSearch: "",
        searchPlaceholder: "Пошук промоакції...",
    }

    const navigate = useNavigate()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)
    const loadPromotionsRef = useRef<(() => Promise<void>) | null>(null)

    // Filter states
    const [active, setActive] = useState<boolean | undefined>(undefined)
    const [date, setDate] = useState<Date | undefined>(undefined)

    const filterParams = useMemo(() => {
        const params: Record<string, any> = {}
        if (active !== undefined) {
            params.active = String(active)
        }
        if (date) {
            params.date = Math.floor(date.getTime() / 1000)
        }
        return params
    }, [active, date])

    const filters = useMemo(
        () => [
            {
                component: (
                    <PromoFilter
                        active={active}
                        date={date}
                        onActiveChange={setActive}
                        onDateChange={setDate}
                    />
                ),
            },
        ],
        [active, date]
    )

    // Handlers for table actions
    const handleCreatePromotion = () => {
        navigate("/promotions/create")
    }

    const handleEditPromotion = (selected: Promotion[]) => {
        const promotion = selected[0]
        if (promotion) {
            navigate(`/promotions/${promotion.promoId}`)
        }
    }

    const handleDeletePromotion = (selected: Promotion[]) => {
        const promotion = selected[0]
        if (promotion) {
            setPromotionToDelete(promotion)
            setDeleteDialogOpen(true)
        }
    }

    const confirmDelete = async () => {
        if (!promotionToDelete) return

        try {
            await deletePromotion(promotionToDelete.promoId)
            toast.success("Промоакцію успішно видалено")
            if (loadPromotionsRef.current) {
                await loadPromotionsRef.current()
            }
        } catch (error: any) {
            toast.error(error.message || "Помилка при видаленні промоакції")
        } finally {
            setDeleteDialogOpen(false)
            setPromotionToDelete(null)
        }
    }

    return (
        <Layout breadcrumbs={[{ label: "Промоакції", path: "/promotions" }]}>
            <div className="p-7">
                <PromotionsTable
                    columns={promotionsColumns}
                    searchProperties={searchProperties}
                    title="Промоакції"
                    onLoadPromotionsRef={loadPromotionsRef}
                    storageKey="promotions"
                    filters={filters}
                    filterParams={filterParams}
                    actions={[
                        {
                            label: "Додати",
                            icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
                            onClick: handleCreatePromotion,
                        },
                        {
                            label: "Редагувати",
                            icon: <Pencil className="mr-0.5 h-4 w-4" />,
                            onClick: handleEditPromotion,
                            isDisabled: (selected: Promotion[]) => selected.length !== 1,
                        },
                        {
                            label: "Видалити",
                            icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                            onClick: handleDeletePromotion,
                            isDisabled: (selected: Promotion[]) => selected.length !== 1,
                            variant: "destructiveOutline",
                        },
                    ]}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Видалити промоакцію"
                description="Ця дія незворотна. Промоакцію буде видалено назавжди."
                itemName={promotionToDelete?.name}
            />
        </Layout>
    )
}
