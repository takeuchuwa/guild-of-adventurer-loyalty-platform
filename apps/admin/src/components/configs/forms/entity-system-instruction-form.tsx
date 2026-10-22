"use client"

import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFormContext } from "react-hook-form"
import { useState, useRef } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const entitySystemInstructionSchema = z.object({
    entity: z.enum(["promotion", "activity", "game", "system", "benefit", "prize"], {
        required_error: "Оберіть тип сутності",
    }),
    systemPrompt: z.string().min(1, "Промпт є обов'язковим"),
    length: z.coerce.number().int().min(1, "Довжина має бути більшою за 0").max(1000, "Максимальна довжина не може перевищувати 1000 символів").default(500),
    outputTokens: z.coerce.number().int().min(1, "Кількість токенів має бути більшою за 0").optional().nullable(),
})

export function EntitySystemInstructionForm({ disableEntity }: { disableEntity?: boolean }) {
    const form = useFormContext<any>()
    const [showSuggestion, setShowSuggestion] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const checkSuggestion = (val: string, selectionStart: number) => {
        const textBeforeCursor = val.substring(0, selectionStart)
        if (textBeforeCursor.endsWith("{{") && !textBeforeCursor.endsWith("{{length}}")) {
            setShowSuggestion(true)
        } else {
            setShowSuggestion(false)
        }
    }

    const insertPlaceholder = () => {
        const textarea = textareaRef.current
        if (!textarea) return

        const val = textarea.value
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        const newVal = val.substring(0, start) + "{{length}}" + val.substring(end)
        form.setValue("config.systemPrompt", newVal)
        setShowSuggestion(false)

        setTimeout(() => {
            textarea.focus()
            textarea.selectionStart = textarea.selectionEnd = start + 10
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget
        const val = textarea.value
        const start = textarea.selectionStart

        if (e.key === "Tab" && showSuggestion) {
            e.preventDefault()
            const newVal = val.substring(0, start) + "length}}" + val.substring(textarea.selectionEnd)
            form.setValue("config.systemPrompt", newVal)
            setShowSuggestion(false)

            setTimeout(() => {
                textarea.focus()
                textarea.selectionStart = textarea.selectionEnd = start + 8
            }, 0)
        }
    }

    return (
        <Form {...form}>
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="config.entity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Тип сутності <span className="text-destructive">*</span></FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={disableEntity}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Оберіть тип сутності" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="promotion">Промоакція</SelectItem>
                                    <SelectItem value="activity">Активність</SelectItem>
                                    <SelectItem value="game">Гра</SelectItem>
                                    <SelectItem value="system">Рольова система</SelectItem>
                                    <SelectItem value="benefit">Перевага</SelectItem>
                                    <SelectItem value="prize">Приз</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Сутність програми лояльності, для якої налаштовується генерація опису.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="config.systemPrompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Промпт для сутності (інструкція) <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Textarea 
                                        placeholder="Введіть інструкції для генерації опису. Наприклад: Згенеруй опис для..." 
                                        className="min-h-[150px]"
                                        {...field}
                                        ref={(e) => {
                                            field.ref(e)
                                            textareaRef.current = e
                                        }}
                                        onKeyDown={(e) => {
                                            handleKeyDown(e)
                                            if (field.onKeyDown) field.onKeyDown(e)
                                        }}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            checkSuggestion(e.target.value, e.target.selectionStart)
                                        }}
                                        onSelect={(e) => {
                                            checkSuggestion(e.currentTarget.value, e.currentTarget.selectionStart)
                                        }}
                                    />
                                    {showSuggestion && (
                                        <div className="absolute right-3 bottom-3 bg-accent border text-accent-foreground text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                                            <Sparkles className="h-3 w-3 text-brass" />
                                            <span>Натисніть <kbd className="bg-muted px-1 rounded font-mono font-bold border">Tab</kbd> для автодоповнення <code className="font-mono text-primary font-bold">{"length}}"}</code></span>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                                <FormDescription className="max-w-[70%]">
                                    Специфічні інструкції з генерації для цієї конкретної сутності. Можна використовувати плейсхолдер <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-foreground">{"{{length}}"}</code>.
                                </FormDescription>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={insertPlaceholder}
                                    className="cursor-pointer text-xs"
                                >
                                    + Вставити {"{{length}}"}
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="config.length"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="min-h-[2.5rem] flex items-end pb-1.5">
                                    Максимальна довжина (в символах) <span className="text-destructive">&nbsp;*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="500" 
                                        max={1000}
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>
                                    Максимальна кількість символів у результаті. Значення підставляється в плейсхолдер <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-foreground">{"{{length}}"}</code>.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="config.outputTokens"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="min-h-[2.5rem] flex items-end pb-1.5">
                                    Максимальна кількість токенів (опціонально)
                                </FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="Автоматично" 
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.onChange(val === "" ? null : Number(val));
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Якщо не вказано, система автоматично вирахує ліміт токенів на основі ліміту символів (ліміт * 3).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </Form>
    )
}
