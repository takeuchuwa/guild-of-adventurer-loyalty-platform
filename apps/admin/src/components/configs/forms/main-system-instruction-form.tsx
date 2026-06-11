"use client"

import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useFormContext } from "react-hook-form"
import { useState, useRef } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const mainSystemInstructionSchema = z.object({
    systemPrompt: z.string().min(1, "Промпт є обов'язковим"),
})

export function MainSystemInstructionForm({ disabled }: { disabled?: boolean }) {
    const form = useFormContext<any>()
    const [showSuggestion, setShowSuggestion] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const checkSuggestion = (val: string, selectionStart: number) => {
        const textBeforeCursor = val.substring(0, selectionStart)
        // Show suggestion if user just typed "{{"
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
                    name="config.systemPrompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Головний системний промпт (правила) <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Textarea 
                                        placeholder="Введіть інструкції для ШІ. Наприклад: Ти — помічник-копірайтер..." 
                                        className="min-h-[200px]"
                                        disabled={disabled}
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
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            <span>Натисніть <kbd className="bg-muted px-1 rounded font-mono font-bold border">Tab</kbd> для автодоповнення <code className="font-mono text-primary font-bold">{"length}}"}</code></span>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                                <FormDescription className="max-w-[70%]">
                                    Визначає роль та загальні правила роботи копірайтера. Використовуйте плейсхолдер <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-foreground">{"{{length}}"}</code> для автоматичної підстановки ліміту символів сутності.
                                </FormDescription>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={disabled}
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
            </div>
        </Form>
    )
}
