"use client"

import { useState, useRef, useEffect } from "react"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Loader2, HelpCircle, GripVertical } from "lucide-react"
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
    const [sidebarWidth, setSidebarWidth] = useState(650)
    const [isResizing, setIsResizing] = useState(false)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const [activeAccordionItem, setActiveAccordionItem] = useState<string>("effects")
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
        if (errors?.config?.effects) setActiveAccordionItem("effects")
        else if (errors?.config?.conditions) setActiveAccordionItem("conditions")
        else if (errors?.config?.targets) setActiveAccordionItem("targets")
        else if (errors?.config?.filter) setActiveAccordionItem("filters")
    }

    // Resize handle logic
    const startResizing = () => {
        setIsResizing(true)
        // Prevent text selection while resizing
        document.body.style.userSelect = 'none'
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return

            const newWidth = window.innerWidth - e.clientX
            const clampedWidth = Math.min(Math.max(newWidth, 300), 1200)
            setSidebarWidth(clampedWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            // Re-enable text selection
            document.body.style.userSelect = ''
        }

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isResizing])

    return (
        <FormProvider {...methods}>
            {/* Form takes full viewport height and uses flex column */}
            <form onSubmit={methods.handleSubmit(handleSubmit, handleFormError)} className="flex flex-col overflow-hidden">
                {/* Main content area - calculated height: 100vh - header (64px) - footer (72px) = h-[calc(100vh-136px)] */}
                {/* CRITICAL: overflow-hidden prevents this container from expanding beyond its height */}
                <div className="flex overflow-hidden h-[calc(100vh-136px)]">
                    {/* Left Pane - h-full ensures it takes full height of parent, overflow-y-auto enables scrolling */}
                    <div className="flex-1 h-full w-full overflow-y-auto p-6 flex items-start justify-center">
                        <div className="space-y-6 w-full max-w-4xl">
                            <MetadataPanel levels={levels} />
                            <AssignmentsPanel existingAssignments={existingAssignments} />
                        </div>
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="w-2 bg-border hover:bg-blue-400 active:bg-blue-600 cursor-col-resize transition-colors shrink-0 flex items-center justify-center group"
                        onMouseDown={startResizing}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>

                    {/* Right Pane - h-full ensures it takes full height of parent */}
                    <div
                        ref={sidebarRef}
                        className="bg-gray-50 border-l shrink-0 h-full overflow-hidden flex flex-col"
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        {/* Inner content - flex-1 and overflow-y-auto enables scrolling */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="border rounded-lg bg-white shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Логіка промоакції</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
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

                                <FormStepper
                                    activeItem={activeAccordionItem}
                                    onToggle={(id) => {
                                        setActiveAccordionItem(activeAccordionItem === id ? "" : id)
                                        // Scroll to it
                                        setTimeout(() => {
                                            document.getElementById(`accordion-trigger-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                                        }, 100)
                                    }}
                                />

                                <Accordion
                                    type="single"
                                    collapsible
                                    value={activeAccordionItem}
                                    onValueChange={(val) => setActiveAccordionItem(val ?? "")}
                                    className="w-full space-y-2"
                                >
                                    <AccordionItem value="effects" className="border rounded-lg px-4 bg-white shadow-sm data-[state=open]:shadow-md transition-all">
                                        <AccordionTrigger id="accordion-trigger-effects" className="text-sm font-medium cursor-pointer hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <span>1. Що отримає клієнт?</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-normal">Обов'язково</span>
                                                <SectionBadge section="effects" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2 pb-4">
                                                <EffectsSection />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="conditions" className="border rounded-lg px-4 bg-white shadow-sm data-[state=open]:shadow-md transition-all">
                                        <AccordionTrigger id="accordion-trigger-conditions" className="text-sm font-medium cursor-pointer hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <span>2. Коли застосувати?</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                                <SectionBadge section="conditions" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2 pb-4">
                                                <ConditionsSection />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="targets" className="border rounded-lg px-4 bg-white shadow-sm data-[state=open]:shadow-md transition-all">
                                        <AccordionTrigger id="accordion-trigger-targets" className="text-sm font-medium cursor-pointer hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <span>3. До чого застосувати?</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                                <SectionBadge section="targets" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2 pb-4">
                                                <TargetsSection targetsMap={targetsMap} />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="filters" className="border rounded-lg px-4 bg-white shadow-sm data-[state=open]:shadow-md transition-all">
                                        <AccordionTrigger id="accordion-trigger-filters" className="text-sm font-medium cursor-pointer hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <span>4. Що виключити?</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                                <SectionBadge section="filters" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2 pb-4">
                                                <GlobalFilterSection targetsMap={targetsMap} />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Action Bar - height is 72px (p-4 = 16px top + 16px bottom + ~40px button) */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-end gap-2">
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

function LivePromoSummary({ levels }: { levels: { levelId: string; name: string }[] }) {
    const { watch } = useFormContext()
    const config = watch("config")
    const levelAssignments = watch("levelAssignments") || []
    const memberIds = watch("assignments.memberIds") || []

    const summaryText = getPromoResumeText(config, levels, levelAssignments, memberIds)

    return (
        <div className="mb-4 p-3 bg-blue-50/50 border border-blue-200/60 rounded-lg flex gap-3 items-start">
            <span className="text-xl leading-none pt-0.5">✨</span>
            <div>
                <h4 className="text-xs font-semibold text-blue-900/80 mb-0.5 uppercase tracking-wider">Промо-резюме</h4>
                <p className="text-sm text-blue-900 font-medium">
                    {summaryText || "Оберіть нагороду вище, щоб побачити превю"}
                </p>
            </div>
        </div>
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
        if (condCount > 0) return <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium ml-1 flex items-center gap-1"><span>✨</span>{condCount} {pluralUk(condCount, "умова", "умови", "умов")}</span>
    }

    if (section === "effects") {
        const effects = config?.effects
        const parts = []
        if (effects?.price?.type === "percentage") parts.push(`-${effects.price.value}%`)
        if (effects?.price?.type === "fixed") parts.push(`-${effects.price.value}₴`)
        if (effects?.price?.type === "override") parts.push(`${effects.price.value}₴`)
        if (effects?.points?.type === "multiplier") parts.push(`×${effects.points.value}`)
        if (effects?.points?.type === "bonus") parts.push(`+${effects.points.value}б`)
        if (parts.length > 0) return <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium ml-1">{parts.join(", ")}</span>
    }

    if (section === "targets") {
        const targets = config?.targets
        if (targets?.type === "cart") return <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium ml-1">Весь кошик</span>
        if (targets?.type === "items") {
            const itemCount = (targets?.categories?.length || 0) + (targets?.products?.length || 0) + (targets?.activities?.length || 0)
            const label = itemCount > 0 ? `Конкретні (${itemCount})` : "Конкретні елементи"
            return <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium ml-1">{label}</span>
        }
        if (targets?.type === "entity") {
            const subTypeLabels: Record<string, string> = {
                products: "Всі товари",
                sessions: "Всі сесії",
                games: "Всі ігри",
            }
            const label = subTypeLabels[targets?.entitySubType as string] ?? "За типом"
            return <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium ml-1">{label}</span>
        }
    }

    if (section === "filters") {
        const filters = config?.filter
        let count = (filters?.excludeCategories?.length || 0) + (filters?.excludeProducts?.length || 0) + (filters?.excludeActivities?.length || 0)
        if (count > 0) return <span className="text-[11px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-medium ml-1">{count} {pluralUk(count, "виключення", "виключення", "виключень")}</span>
    }

    return null
}

function FormStepper({ activeItem, onToggle }: { activeItem: string, onToggle: (id: string) => void }) {
    const steps = [
        { id: "effects", label: "Нагороди" },
        { id: "conditions", label: "Умови" },
        { id: "targets", label: "Ціль" },
        { id: "filters", label: "Виключення" },
    ]

    return (
        <div className="flex items-center justify-between mb-4 bg-muted/30 p-1.5 rounded-lg border gap-1 overflow-x-auto">
            {steps.map((step, i) => {
                const isActive = activeItem === step.id
                return (
                    <button
                        key={step.id}
                        type="button"
                        onClick={() => onToggle(step.id)}
                        className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${isActive
                            ? "bg-white text-primary shadow-sm ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                    >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {i + 1}
                        </span>
                        {step.label}
                    </button>
                )
            })}
        </div>
    )
}
