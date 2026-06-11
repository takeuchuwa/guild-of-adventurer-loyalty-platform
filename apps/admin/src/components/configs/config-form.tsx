"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LevelChangeForm, levelChangeSchema, } from "@/components/configs/forms/level-change-form"
import { ActivityTimeSlotForm, activityTimeSlotSchema } from "@/components/configs/forms/activity-time-slot-form"
import { MainSystemInstructionForm, mainSystemInstructionSchema } from "@/components/configs/forms/main-system-instruction-form"
import { EntitySystemInstructionForm, entitySystemInstructionSchema } from "@/components/configs/forms/entity-system-instruction-form"
import { Button } from "@/components/ui/button"

const baseSchema = z.object({
    name: z.string().min(1, "Назва є обов'язковою"),
    active: z.boolean(),
    triggerKey: z.enum(["level_change", "activity_time_slot", "main_system_instruction", "entity_system_instruction"]),
});

export const formSchema = z.discriminatedUnion("triggerKey", [
    baseSchema.extend({
        triggerKey: z.literal("level_change"),
        config: levelChangeSchema,
    }),
    baseSchema.extend({
        triggerKey: z.literal("activity_time_slot"),
        config: activityTimeSlotSchema,
    }),
    baseSchema.extend({
        triggerKey: z.literal("main_system_instruction"),
        config: mainSystemInstructionSchema,
    }),
    baseSchema.extend({
        triggerKey: z.literal("entity_system_instruction"),
        config: entitySystemInstructionSchema,
    }),
]);

export type ConfigFormValues = z.infer<typeof formSchema>

export function ConfigForm({
    mode,
    initial,
    onSubmit,
    onCancel,
    disableTrigger,
}: {
    mode: "create" | "edit"
    initial?: Partial<ConfigFormValues>
    onSubmit: (values: ConfigFormValues) => void
    onCancel?: () => void
    disableTrigger?: boolean
}) {
    // Map database suffix format "entity_system_instruction:entity" -> frontend form structure
    let initialTriggerKey = initial?.triggerKey;
    let initialConfig = initial?.config;
    
    if (initialTriggerKey && initialTriggerKey.startsWith("entity_system_instruction:")) {
        const entity = initialTriggerKey.split(":")[1];
        initialTriggerKey = "entity_system_instruction" as any;
        initialConfig = {
            ...initialConfig,
            entity: entity,
        };
    }

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initial?.name || "",
            active: initial?.active ?? true,
            triggerKey: (initialTriggerKey as any) || undefined,
            config: initialConfig
                ? (initialConfig as any)
                : initialTriggerKey === "activity_time_slot"
                    ? ({ startHour: "", endHour: "" } as any)
                    : initialTriggerKey === "main_system_instruction"
                        ? ({ systemPrompt: "" } as any)
                        : initialTriggerKey === "entity_system_instruction"
                            ? ({ entity: "", systemPrompt: "", length: 500, outputTokens: null } as any)
                            : ({
                                targetLevel: "",
                                pointsForReferrer: 0,
                                pointsForReferred: 0,
                                notifyReferrer: true,
                                notifyReferred: true,
                            } as any),
        },
    })

    const selectedTrigger = form.watch("triggerKey")

    return (
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit((vals) => {
                // Map triggerKey back to the suffix-based key "entity_system_instruction:entity" for saving
                let finalVals = { ...vals }
                if (vals.triggerKey === "entity_system_instruction") {
                    const entity = (vals as any).config?.entity
                    finalVals.triggerKey = `entity_system_instruction:${entity}` as any
                }
                onSubmit(finalVals)
            })}>
                <Card className="bg-card border rounded-lg">
                    <CardHeader>
                        <CardTitle>Основна інформація</CardTitle>
                        <CardDescription>Назва, тип тригера та статус конфігурації</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Назва <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Назва конфігурації" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="triggerKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Тригер <span className="text-destructive">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}
                                        disabled={disableTrigger}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Оберіть тригер" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="level_change">Зміна рівня учасника</SelectItem>
                                            <SelectItem value="activity_time_slot">Часові слоти активностей</SelectItem>
                                            <SelectItem value="main_system_instruction">Головна системна інструкція ШІ</SelectItem>
                                            <SelectItem value="entity_system_instruction">Інструкція ШІ для сутності</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 mt-2 mb-2">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel>Активна</FormLabel>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {selectedTrigger && (
                    <Card className="bg-card border rounded-lg">
                        <CardHeader>
                            <CardTitle>Конфігурація тригера</CardTitle>
                            <CardDescription>
                                {selectedTrigger === "level_change" && "Налаштування для зміни рівня учасника"}
                                {selectedTrigger === "activity_time_slot" && "Налаштування часових слотів для активностей"}
                                {selectedTrigger === "main_system_instruction" && "Налаштування головної інструкції ШІ (роль та загальні правила)"}
                                {selectedTrigger === "entity_system_instruction" && "Налаштування інструкції ШІ для конкретного типу сутності"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedTrigger === "level_change" && <LevelChangeForm />}
                            {selectedTrigger === "activity_time_slot" && <ActivityTimeSlotForm />}
                            {selectedTrigger === "main_system_instruction" && <MainSystemInstructionForm />}
                            {selectedTrigger === "entity_system_instruction" && <EntitySystemInstructionForm disableEntity={disableTrigger} />}
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" className="cursor-pointer" onClick={onCancel}>
                            Скасувати
                        </Button>
                    )}
                    <Button type="submit" className="cursor-pointer">{mode === "create" ? "Створити" : "Зберегти"}</Button>
                </div>
            </form>
        </Form>
    )
}
