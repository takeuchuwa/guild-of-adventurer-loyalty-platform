"use client"

import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useFormContext } from "react-hook-form"

export const activityTimeSlotSchema = z.object({
    startHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Невірний формат часу (ГГ:ХХ)"),
    endHour: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Невірний формат часу (ГГ:ХХ)"),
})

export function ActivityTimeSlotForm({ disabled }: { disabled?: boolean }) {
    const form = useFormContext<any>()

    return (
        <Form {...form}>
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name={"config.startHour" as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Час початку *</FormLabel>
                            <FormControl>
                                <Input placeholder="11:00" {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={"config.endHour" as any}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Час завершення *</FormLabel>
                            <FormControl>
                                <Input placeholder="15:00" {...field} disabled={disabled} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </Form>
    )
}
