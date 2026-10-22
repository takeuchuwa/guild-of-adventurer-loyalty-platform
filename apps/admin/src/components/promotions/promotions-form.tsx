"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { MetadataPanel } from "./metadata-panel"
import { AssignmentsPanel, type PromotionAssignment } from "./assignments-panel"
import { ConditionsSection } from "./conditions-section"
import { EffectsSection } from "./effects-section"
import { GlobalFilterSection } from "./global-filter-section"
import { TargetsSection } from "./targets-section"
import { Loader2, HelpCircle } from "lucide-react"
import { Shape } from "@/components/ui/glyph"
import { fetchLevels } from "@/components/levels/api/level-api"
import { getPromoResumeText, pluralUk } from "./utils/promo-helper"

// Define the promotion form schema
const promotionSchema = z.object({
    name: z.string().min(1, "Назва обов'язкова"),
    description: z.string().optional(),
    active: z.boolean(),
    combinable: z.boolean().default(false),
    mode: z.enum(["AUTO", "COUPON"]),
    code: z.string().optional(),
    // -1 = permanent (no date restriction)
    startDate: z.number().min(-1, "Дата початку обов'язкова").optional(),
    endDate: z.number().min(-1, "Дата завершення обов'язкова").optional(),
    isPermanent: z.boolean().default(false),
    config: z.object({
        filter: z.object({
            excludeCategories: z.array(z.string()),
            excludeProducts: z.array(z.string()),
            excludeActivities: z.array(z.string()),
        }),
        conditions: z.object({
            cartConditions: z.object({
                cart_total: z.number().optional(),
                cart_item_count: z.number().optional(),
            }).optional(),
            itemConditions: z.object({
                contains_category: z.object({
                    mode: z.enum(["include", "exclude"]),
                    logic: z.enum(["any", "all"]),
                    values: z.array(z.string()),
                }).optional(),
                contains_product: z.object({
                    mode: z.enum(["include", "exclude"]),
                    logic: z.enum(["any", "all"]),
                    values: z.array(z.string()),
                }).optional(),
                contains_activity: z.object({
                    mode: z.enum(["include", "exclude"]),
                    logic: z.enum(["any", "all"]),
                    values: z.array(z.string()),
                }).optional(),
            }).optional(),
            memberConditions: z.object({
                member_is_new: z.number().optional(),
                member_is_birthday: z.number().optional(),
                max_usage_per_member: z.object({
                    limit: z.number().int().min(1),
                    period: z.string(),
                }).optional(),
            }).optional(),
        }).partial().optional(),
        effects: z.object({
            price: z.object({
                type: z.enum(["percentage", "fixed", "override"]),
                value: z.number(),
            }).optional(),
            points: z.object({
                type: z.enum(["multiplier", "bonus"]),
                value: z.number(),
            }).optional(),
            inventory: z.object({
                type: z.enum(["product", "activity"]),
                itemId: z.string().min(1),
                itemName: z.string().optional(),
            }).optional(),
        }).refine(
            (effects) => {
                // At least one effect must be specified
                return effects.price !== undefined || effects.points !== undefined || effects.inventory !== undefined
            },
            {
                message: "Необхідно вказати хоча б один ефект (знижка, бали або товар)",
            }
        ),
        targets: z.object({
            type: z.enum(["cart", "items", "entity"]),
            entitySubType: z.enum(["products", "sessions", "games"]).optional(),
            categories: z.array(z.string()).optional(),
            products: z.array(z.string()).optional(),
            activities: z.array(z.string()).optional(),
        }),
    }),
    priority: z.number().int().min(0).default(0),
    usageRemaining: z.number().int().min(1).nullable().optional(),
    assignments: z.object({
        memberIds: z.array(z.string()),
        generateUniqueCodes: z.boolean(),
    }),
    levelAssignments: z.array(z.string()).default([]),
}).refine(
    (data) => {
        // When not permanent, both dates are required
        if (!data.isPermanent) {
            return data.startDate !== undefined && data.startDate > 0
        }
        return true
    },
    {
        message: "Дата початку обов'язкова",
        path: ["startDate"],
    }
).refine(
    (data) => {
        // When not permanent, both dates are required
        if (!data.isPermanent) {
            return data.endDate !== undefined && data.endDate > 0
        }
        return true
    },
    {
        message: "Дата завершення обов'язкова",
        path: ["endDate"],
    }
).refine(
    (data) => {
        // When both dates are present, end must be after start
        if (data.startDate !== undefined && data.startDate > 0 && data.endDate !== undefined && data.endDate > 0) {
            return data.endDate > data.startDate
        }
        return true
    },
    {
        message: "Дата завершення має бути пізніше дати початку",
        path: ["endDate"],
    }
).refine(
    (data) => {
        // If mode is COUPON, code is required
        if (data.mode === "COUPON") {
            return data.code && data.code.length > 0
        }
        return true
    },
    {
        message: "Код обов'язковий для купонів",
        path: ["code"],
    }
)

type PromotionFormData = z.infer<typeof promotionSchema>

interface PromotionsFormProps {
    initialData?: Partial<PromotionFormData>
    targetsMap?: Record<string, string>
    onSubmit: (data: PromotionFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
    existingAssignments?: PromotionAssignment[]
}

export function PromotionsForm({ initialData, targetsMap, onSubmit, onCancel, isLoading, mode, existingAssignments }: PromotionsFormProps) {
    const [levels, setLevels] = useState<{ levelId: string; name: string }[]>([])

    useEffect(() => {
        async function loadLevels() {
            try {
                const data = await fetchLevels({
                    pagination: { pageIndex: 0, pageSize: 100 }
                })
                setLevels(data.levels || [])
            } catch (err) {
                console.error("Failed to fetch levels in form", err)
            }
        }
        loadLevels()
    }, [])

    const methods = useForm<PromotionFormData>({
        resolver: zodResolver(promotionSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            active: initialData?.active ?? true,
            combinable: initialData?.combinable ?? true,
            mode: initialData?.mode || "AUTO",
            code: initialData?.code || "",
            isPermanent: initialData?.startDate === -1 && initialData?.endDate === -1 ? true : false,
            startDate: initialData?.startDate === -1 ? -1 : (initialData?.startDate || Math.floor(Date.now() / 1000)),
            endDate: initialData?.endDate === -1 ? -1 : (initialData?.endDate || Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)),
            config: {
                filter: {
                    excludeCategories: initialData?.config?.filter?.excludeCategories || [],
                    excludeProducts: initialData?.config?.filter?.excludeProducts || [],
                    excludeActivities: initialData?.config?.filter?.excludeActivities || [],
                },
                conditions: initialData?.config?.conditions || {},
                effects: initialData?.config?.effects || {},
                targets: {
                    type: initialData?.config?.targets?.type || "cart",
                    entitySubType: initialData?.config?.targets?.entitySubType || "products",
                    categories: initialData?.config?.targets?.categories || [],
                    products: initialData?.config?.targets?.products || [],
                    activities: initialData?.config?.targets?.activities || [],
                },
            },
            priority: initialData?.priority ?? 0,
            usageRemaining: initialData?.usageRemaining ?? null,
            assignments: {
                memberIds: initialData?.assignments?.memberIds || [],
                generateUniqueCodes: initialData?.assignments?.generateUniqueCodes ?? false,
            },
            levelAssignments: (initialData as any)?.levelAssignments || [],
        },
    })

    const handleSubmit = async (data: PromotionFormData) => {
        try {
            console.log("Form submission data:", JSON.stringify(data, null, 2))
            await onSubmit(data)
        } catch (error) {
            console.error("Form submission error:", error)
        }
    }

    const handleFormError = (errors: any) => {
        console.log("Form validation errors:", errors)
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit, handleFormError)} className="flex min-h-0 flex-col">
                <div className="flex flex-col gap-6 px-8 py-[30px]">
                    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                        <MetadataPanel levels={levels} />
                        <AssignmentsPanel existingAssignments={existingAssignments} />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="font-heading text-[24px] leading-none font-semibold uppercase tracking-[.06em]">
                                Логіка промоакції
                            </h2>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                            <HelpCircle className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs text-sm">
                                        <p className="font-semibold mb-1">Як налаштувати промоакцію:</p>
                                        <ol className="list-decimal pl-4 space-y-1">
                                            <li><strong>Що отримає клієнт?</strong> — обов'язково оберіть знижку або бонус</li>
                                            <li><strong>Коли застосувати?</strong> — за бажанням додайте додаткові умови, якщо умов немає промоакція буде застосовуватись завжди до цільової аудиторії</li>
                                            <li><strong>До чого?</strong> — до всього кошика або конкретних товарів</li>
                                            <li><strong>Виключення</strong> — що НЕ підпадає під акцію</li>
                                        </ol>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <LivePromoSummary levels={levels} />

                        {/* Three columns, coded by the icon system: diamond = ефекти, square = умови, circle = цілі. */}
                        <div className="grid grid-cols-1 gap-px bg-[rgba(201,158,58,.2)] xl:grid-cols-3">
                            <RuleColumn shape="diamond" title="Що отримає клієнт?" required badge={<SectionBadge section="effects" />}>
                                <EffectsSection />
                            </RuleColumn>

                            <RuleColumn shape="square" title="Коли застосувати?" badge={<SectionBadge section="conditions" />}>
                                <ConditionsSection />
                            </RuleColumn>

                            <RuleColumn shape="circle" title="До чого застосувати?" badge={<SectionBadge section="targets" />}>
                                <TargetsSection targetsMap={targetsMap} />

                                <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(201,158,58,.16)] pt-5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary font-heading text-[13px] font-semibold uppercase tracking-[.08em]">Що виключити?</span>
                                        <SectionBadge section="filters" />
                                    </div>
                                    <GlobalFilterSection targetsMap={targetsMap} />
                                </div>
                            </RuleColumn>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-alt sticky bottom-0 z-10 border-t border-[rgba(201,158,58,.22)] px-8 py-4">
                    <div className="flex justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="cursor-pointer"
                        >
                            Скасувати
                        </Button>
                        <Button type="submit" disabled={isLoading} className="cursor-pointer">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === "create" ? "Створити промоакцію" : "Зберегти промоакцію"}
                        </Button>
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

/** One rule column: its geometric mark, the heading and the section body. */
function RuleColumn({
    shape,
    title,
    required,
    badge,
    children,
}: {
    shape: "square" | "diamond" | "circle"
    title: string
    required?: boolean
    badge?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="bg-surface-alt flex min-w-0 flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-2.5">
                <Shape variant={shape} size={14} stroke={2} className="text-primary" />
                <span className="text-primary font-heading text-[15px] font-semibold uppercase tracking-[.06em]">{title}</span>
                {required && (
                    <span className="text-destructive font-heading border border-[rgba(126,43,33,.7)] px-1.5 py-[2px] text-[10.5px] font-semibold uppercase tracking-[.1em]">
                        Обов'язково
                    </span>
                )}
                {badge}
            </div>
            {children}
        </div>
    )
}

function LivePromoSummary({ levels }: { levels: { levelId: string; name: string }[] }) {
    const { watch } = useFormContext()
    const config = watch("config")
    const levelAssignments = watch("levelAssignments") || []
    const memberIds = watch("assignments.memberIds") || []

    const summaryText = getPromoResumeText(config, levels, levelAssignments, memberIds)

    return (
        <div className="border border-[rgba(201,158,58,.35)] bg-[rgba(201,158,58,.06)] p-4">
            <h4 className="text-primary font-heading text-[11px] font-semibold uppercase tracking-[.16em]">Промо-резюме</h4>
            <p className="mt-2 text-[14.5px] leading-[1.5]">
                {summaryText || "Оберіть нагороду вище, щоб побачити превю"}
            </p>
        </div>
    )
}

/** Hairline tag summarising a column. Stays mono — it carries figures. */
function SectionTag({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-accent-bright border border-[rgba(201,158,58,.45)] px-2 py-[2px] font-mono text-[11px] tracking-[.06em] whitespace-nowrap">
            {children}
        </span>
    )
}

function SectionBadge({ section }: { section: "conditions" | "effects" | "targets" | "filters" }) {
    const { watch } = useFormContext()
    const config = watch("config")

    if (section === "conditions") {
        let condCount = 0
        if (config?.conditions?.cartConditions) condCount += Object.keys(config.conditions.cartConditions).length
        if (config?.conditions?.itemConditions) condCount += Object.keys(config.conditions.itemConditions).length
        if (config?.conditions?.memberConditions) condCount += Object.keys(config.conditions.memberConditions).length
        if (condCount > 0) return <SectionTag>{condCount} {pluralUk(condCount, "умова", "умови", "умов")}</SectionTag>
    }

    if (section === "effects") {
        const effects = config?.effects
        const parts = []
        if (effects?.price?.type === "percentage") parts.push(`-${effects.price.value}%`)
        if (effects?.price?.type === "fixed") parts.push(`-${effects.price.value}₴`)
        if (effects?.price?.type === "override") parts.push(`${effects.price.value}₴`)
        if (effects?.points?.type === "multiplier") parts.push(`×${effects.points.value}`)
        if (effects?.points?.type === "bonus") parts.push(`+${effects.points.value}б`)
        if (parts.length > 0) return <SectionTag>{parts.join(", ")}</SectionTag>
    }

    if (section === "targets") {
        const targets = config?.targets
        if (targets?.type === "cart") return <SectionTag>Весь кошик</SectionTag>
        if (targets?.type === "items") {
            const itemCount = (targets?.categories?.length || 0) + (targets?.products?.length || 0) + (targets?.activities?.length || 0)
            const label = itemCount > 0 ? `Конкретні (${itemCount})` : "Конкретні елементи"
            return <SectionTag>{label}</SectionTag>
        }
        if (targets?.type === "entity") {
            const subTypeLabels: Record<string, string> = {
                products: "Всі товари",
                sessions: "Всі сесії",
                games: "Всі ігри",
            }
            const label = subTypeLabels[targets?.entitySubType as string] ?? "За типом"
            return <SectionTag>{label}</SectionTag>
        }
    }

    if (section === "filters") {
        const filters = config?.filter
        let count = (filters?.excludeCategories?.length || 0) + (filters?.excludeProducts?.length || 0) + (filters?.excludeActivities?.length || 0)
        if (count > 0) return <SectionTag>{count} {pluralUk(count, "виключення", "виключення", "виключень")}</SectionTag>
    }

    return null
}
