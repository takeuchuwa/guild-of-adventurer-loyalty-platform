"use client"

import { useState, useRef, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { MetadataPanel } from "./metadata-panel"
import { AssignmentsPanel, type PromotionAssignment } from "./assignments-panel"
import { ConditionsSection } from "./conditions-section"
import { EffectsSection } from "./effects-section"
import { GlobalFilterSection } from "./global-filter-section"
import { TargetsSection } from "./targets-section"
import { Loader2 } from "lucide-react"

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
    onSubmit: (data: PromotionFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    mode: "create" | "edit"
    existingAssignments?: PromotionAssignment[]
}

export function PromotionsForm({ initialData, onSubmit, onCancel, isLoading, mode, existingAssignments }: PromotionsFormProps) {
    const [sidebarWidth, setSidebarWidth] = useState(650)
    const [isResizing, setIsResizing] = useState(false)
    const sidebarRef = useRef<HTMLDivElement>(null)

    const methods = useForm<PromotionFormData>({
        resolver: zodResolver(promotionSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            active: initialData?.active ?? true,
            combinable: initialData?.combinable ?? false,
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
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="flex flex-col overflow-hidden">
                {/* Main content area - calculated height: 100vh - header (64px) - footer (72px) = h-[calc(100vh-136px)] */}
                {/* CRITICAL: overflow-hidden prevents this container from expanding beyond its height */}
                <div className="flex overflow-hidden h-[calc(100vh-136px)]">
                    {/* Left Pane - h-full ensures it takes full height of parent, overflow-y-auto enables scrolling */}
                    <div className="flex-1 h-full w-full overflow-y-auto p-6 flex items-start justify-center">
                        <div className="space-y-6 w-full max-w-4xl">
                            <MetadataPanel />
                            <AssignmentsPanel existingAssignments={existingAssignments} />
                        </div>
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="w-1 bg-border hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-colors shrink-0"
                        onMouseDown={startResizing}
                        style={{ cursor: isResizing ? "col-resize" : "col-resize" }}
                    />

                    {/* Right Pane - h-full ensures it takes full height of parent */}
                    <div
                        ref={sidebarRef}
                        className="bg-gray-50 border-l shrink-0 h-full overflow-hidden flex flex-col"
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        {/* Inner content - flex-1 and overflow-y-auto enables scrolling */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="border rounded-lg bg-white shadow-sm p-4">
                                <h3 className="text-lg font-semibold mb-4">Логіка промоакції</h3>
                                <Accordion type="multiple" defaultValue={["conditions", "effects", "targets", "filters"]} className="w-full">
                                    <AccordionItem value="conditions">
                                        <AccordionTrigger className="text-sm font-medium cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span>1. Умови (IF)</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2">
                                                <ConditionsSection />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="effects">
                                        <AccordionTrigger className="text-sm font-medium cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span>2. Ефекти (THEN)</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-normal">Обов'язково</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2">
                                                <EffectsSection />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="targets">
                                        <AccordionTrigger className="text-sm font-medium cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span>3. Цілі застосування</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2">
                                                <TargetsSection />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="filters">
                                        <AccordionTrigger className="text-sm font-medium cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span>4. Глобальні виключення</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">Опціонально</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2">
                                                <GlobalFilterSection />
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
