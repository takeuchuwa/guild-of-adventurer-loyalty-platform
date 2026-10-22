"use client"

import * as React from "react"
import { useState } from "react"
import { Textarea } from "./textarea"
import { Button } from "./button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { axiosInstance } from "@/lib/api-utils.ts"
import { cn } from "@/lib/utils"

export interface AiTextareaProps extends React.ComponentProps<"textarea"> {
    entityType: "promotion" | "activity" | "game" | "system" | "benefit" | "prize"
    entityName?: string
    getContextConfig?: () => any
    promoResume?: string
    onValueChange?: (value: string) => void
}

const AiTextarea = React.forwardRef<HTMLTextAreaElement, AiTextareaProps>(
    ({ className, entityType, entityName, getContextConfig, promoResume, onValueChange, onChange, ...props }, ref) => {
        const [isGenerating, setIsGenerating] = useState(false)
        const localRef = React.useRef<HTMLTextAreaElement | null>(null)

        // Merge forwarded ref and local ref
        React.useImperativeHandle(ref, () => localRef.current!)

        const handleGenerate = async (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            if (!entityName || !entityName.trim()) {
                toast.error("Будь ласка, спочатку введіть назву для генерації опису")
                return
            }

            setIsGenerating(true)
            const toastId = toast.loading("Генерація опису...")

            try {
                const config = getContextConfig ? getContextConfig() : undefined
                const response = await axiosInstance.post("/ai/generate-description", {
                    type: entityType,
                    name: entityName,
                    existingDescription: localRef.current?.value || "",
                    config,
                    promoResume,
                })

                if (response.data && response.data.ok) {
                    const generatedText = response.data.data

                    // Update value in DOM and trigger react state updates
                    if (localRef.current) {
                        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
                            HTMLTextAreaElement.prototype,
                            "value",
                        )?.set

                        if (nativeTextareaValueSetter) {
                            nativeTextareaValueSetter.call(localRef.current, generatedText)
                            const inputEvent = new Event("input", { bubbles: true })
                            localRef.current.dispatchEvent(inputEvent)
                        } else {
                            localRef.current.value = generatedText
                        }
                    }

                    // Call callbacks
                    if (onValueChange) {
                        onValueChange(generatedText)
                    }

                    if (onChange) {
                        const syntheticEvent = {
                            target: {
                                value: generatedText,
                                name: props.name || "",
                                id: props.id || "",
                            },
                        } as React.ChangeEvent<HTMLTextAreaElement>
                        onChange(syntheticEvent)
                    }

                    toast.success("Опис успішно згенеровано!", { id: toastId })
                } else {
                    throw new Error(response.data?.message || "Не вдалося згенерувати опис")
                }
            } catch (err: any) {
                console.error("AI Generation Error:", err)
                const errMsg = err.response?.data?.message || err.message || "Помилка сервера при генерації"
                toast.error(`Помилка генерації: ${errMsg}`, { id: toastId })
            } finally {
                setIsGenerating(false)
            }
        }

        return (
            <div className="relative w-full">
                <Textarea
                    {...props}
                    ref={localRef}
                    onChange={onChange}
                    className={cn("pb-8", className)}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleGenerate}
                    disabled={isGenerating || props.disabled}
                    className={cn(
                        "absolute bottom-1.5 right-3 h-6 w-6 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all cursor-pointer z-10",
                        isGenerating && "animate-pulse",
                    )}
                    title="Згенерувати опис за допомогою ШІ"
                >
                    {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary hover:text-primary dark:text-primary" />
                    )}
                </Button>
            </div>
        )
    }
)

AiTextarea.displayName = "AiTextarea"

export { AiTextarea }
