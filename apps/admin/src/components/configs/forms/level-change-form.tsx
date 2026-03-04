"use client"

import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useFormContext } from "react-hook-form"

export const levelChangeSchema = z.object({
  targetLevel: z.string().min(1, "Оберіть рівень (ID, наприклад E)"),
  pointsForReferrer: z.number().min(0),
  pointsForReferred: z.number().min(0),
  notifyReferrer: z.boolean(),
  notifyReferred: z.boolean(),
})

export function LevelChangeForm({ disabled }: { disabled?: boolean }) {
  // Use parent form context; fields are nested under "config.*"
  const form = useFormContext<any>()

  return (
    <Form {...form}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={"config.targetLevel" as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цільовий рівень *</FormLabel>
              <FormControl>
                <Input placeholder="E" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={"config.pointsForReferrer" as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Бали для реферера *</FormLabel>
              <FormControl>
                  <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      value={field.value || 0}
                      disabled={disabled}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={"config.pointsForReferred" as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Бали для запрошеного *</FormLabel>
              <FormControl>
                  <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      value={field.value || 0}
                      disabled={disabled}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-6 mt-6">
          <FormField
            control={form.control}
            name={"config.notifyReferrer" as any}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
                </FormControl>
                <FormLabel>Повідомити реферера</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={"config.notifyReferred" as any}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
                </FormControl>
                <FormLabel>Повідомити запрошеного</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  )
}
