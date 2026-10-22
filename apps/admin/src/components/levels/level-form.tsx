"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { AddChip, FormActions, FormShell, RailSection } from "@/components/shared/form-shell"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Level, LevelFormData } from "./types/level-types"
import { X } from "lucide-react"
import { useState } from "react"
import { AiTextarea } from "@/components/ui/ai-textarea"

const levelFormSchema = z.object({
    levelId: z.string().min(1, "ID рівня обов'язковий"),
    name: z.string().min(1, "Назва обов'язкова"),
    minPoints: z.coerce.number().int().min(0, "Мінімальна кількість балів має бути >= 0"),
    defaultLevel: z.boolean().optional(),
    sortOrder: z.coerce.number().int(),
})

interface LevelFormProps {
    mode: "create" | "edit"
    initialData?: Level
    onSubmit: (data: LevelFormData) => void
    onCancel: () => void
    isLoading?: boolean
}

export function LevelForm({ mode, initialData, onSubmit, onCancel, isLoading }: LevelFormProps) {
    const [benefits, setBenefits] = useState<Array<{ name: string; description: string }>>(
        initialData?.benefits?.map((b) => ({ name: b.name, description: b.description || "" })) || [],
    )
    const [prizes, setPrizes] = useState<Array<{ name: string; description: string }>>(
        initialData?.prizes?.map((p) => ({ name: p.name, description: p.description || "" })) || [],
    )

    const form = useForm<z.infer<typeof levelFormSchema>>({
        resolver: zodResolver(levelFormSchema),
        defaultValues: {
            levelId: initialData?.levelId || "",
            name: initialData?.name || "",
            minPoints: initialData?.minPoints || 0,
            defaultLevel: initialData?.defaultLevel || false,
            sortOrder: initialData?.sortOrder || 0,
        },
    })

    const handleSubmit = (data: z.infer<typeof levelFormSchema>) => {
        onSubmit({
            ...data,
            benefits: benefits.filter((b) => b.name.trim() !== ""),
            prizes: prizes.filter((p) => p.name.trim() !== ""),
        } as LevelFormData)
    }

    return (
        <Form {...form} >
            <FormShell
                title={mode === "create" ? "Створити рівень" : "Редагувати рівень"}
                description={mode === "create" ? "Заповніть форму для створення нового рівня лояльності" : "Оновіть інформацію про рівень лояльності"}
                onSubmit={form.handleSubmit(handleSubmit)}
                actions={<FormActions mode={mode} isLoading={isLoading} onCancel={onCancel} />}
                rail={
                    <RailSection title="Налаштування">
                        <FormField
                            control={form.control}
                            name="sortOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Порядок сортування</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} placeholder="0" />
                                    </FormControl>
                                    <FormDescription>Порядок відображення рівня (менше число = вище)</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="defaultLevel"
                            render={({ field }) => (
                                <FormItem className="border-hairline flex flex-row items-start space-y-0 space-x-3 border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Рівень за замовчуванням</FormLabel>
                                        <FormDescription>
                                            Цей рівень буде призначатися новим користувачам (може бути тільки один)
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </RailSection>
                }
            >
                <FormField
                    control={form.control}
                    name="levelId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID рівня *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="F, E, D, C, B, A, S" disabled={mode === "edit"} />
                            </FormControl>
                            <FormDescription>Унікальний ідентифікатор рівня (наприклад: F, E, D)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Назва *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Новачок" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="minPoints"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Мінімальна кількість балів *</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="0" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />



                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Переваги</FormLabel>
                        <AddChip onClick={() => setBenefits([...benefits, { name: "", description: "" }])}>
                            + Додати перевагу
                        </AddChip>
                    </div>
                    {benefits.map((benefit, index) => (
                        <div key={index} className="border-hairline flex items-start gap-2 border p-4">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Назва переваги"
                                    value={benefit.name}
                                    onChange={(e) => {
                                        const newBenefits = [...benefits]
                                        newBenefits[index].name = e.target.value
                                        setBenefits(newBenefits)
                                    }}
                                />
                                <AiTextarea
                                    placeholder="Опис переваги"
                                    value={benefit.description}
                                    onChange={(e) => {
                                        const newBenefits = [...benefits]
                                        newBenefits[index].description = e.target.value
                                        setBenefits(newBenefits)
                                    }}
                                    rows={2}
                                    entityType="benefit"
                                    entityName={benefit.name}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setBenefits(benefits.filter((_, i) => i !== index))}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Призи</FormLabel>
                        <AddChip onClick={() => setPrizes([...prizes, { name: "", description: "" }])}>
                            + Додати приз
                        </AddChip>
                    </div>
                    {prizes.map((prize, index) => (
                        <div key={index} className="border-hairline flex items-start gap-2 border p-4">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Назва призу"
                                    value={prize.name}
                                    onChange={(e) => {
                                        const newPrizes = [...prizes]
                                        newPrizes[index].name = e.target.value
                                        setPrizes(newPrizes)
                                    }}
                                />
                                <AiTextarea
                                    placeholder="Опис призу"
                                    value={prize.description}
                                    onChange={(e) => {
                                        const newPrizes = [...prizes]
                                        newPrizes[index].description = e.target.value
                                        setPrizes(newPrizes)
                                    }}
                                    rows={2}
                                    entityType="prize"
                                    entityName={prize.name}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setPrizes(prizes.filter((_, i) => i !== index))}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

            </FormShell>
        </Form>
    )
}
