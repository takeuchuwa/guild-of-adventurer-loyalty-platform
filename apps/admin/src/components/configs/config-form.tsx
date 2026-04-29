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
import { Button } from "@/components/ui/button"

const baseSchema = z.object({
    name: z.string().min(1),
    active: z.boolean(),
    triggerKey: z.enum(["level_change", "activity_time_slot"]),
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
]);

export type ConfigFormValues = z.infer<typeof formSchema>

export function ConfigForm({
    mode,
    initial,
    onSubmit,
    disableTrigger,
}: {
    mode: "create" | "edit"
    initial?: Partial<ConfigFormValues>
    onSubmit: (values: ConfigFormValues) => void
    disableTrigger?: boolean
}) {
    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initial?.name || "",
            active: initial?.active ?? true,
            triggerKey: (initial?.triggerKey as any) || undefined,
            config: initial?.config
                ? (initial.config as any)
                : initial?.triggerKey === "activity_time_slot"
                    ? ({ startHour: "", endHour: "" } as any)
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
            <form className="space-y-6" onSubmit={form.handleSubmit((vals) => onSubmit(vals))}>
                <Card className="bg-card border rounded-lg">
                    <CardHeader>
                        <CardTitle>Основна інформація</CardTitle>
                        <CardDescription>Налаштування назви, статусу та типу тригера</CardDescription>
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
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedTrigger === "level_change" && <LevelChangeForm />}
                            {selectedTrigger === "activity_time_slot" && <ActivityTimeSlotForm />}
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-3">
                    <Button type="submit" className="cursor-pointer">{mode === "create" ? "Створити" : "Зберегти"}</Button>
                </div>
            </form>
        </Form>
    )
}
