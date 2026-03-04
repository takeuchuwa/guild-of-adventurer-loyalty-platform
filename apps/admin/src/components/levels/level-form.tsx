"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Level, LevelFormData } from "./types/level-types"
import { X, Plus } from "lucide-react"
import { useState } from "react"

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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBenefits([...benefits, { name: "", description: "" }])}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Додати перевагу
                        </Button>
                    </div>
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex gap-2 items-start border p-4 rounded-md">
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
                                <Input
                                    placeholder="Опис переваги"
                                    value={benefit.description}
                                    onChange={(e) => {
                                        const newBenefits = [...benefits]
                                        newBenefits[index].description = e.target.value
                                        setBenefits(newBenefits)
                                    }}
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrizes([...prizes, { name: "", description: "" }])}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Додати приз
                        </Button>
                    </div>
                    {prizes.map((prize, index) => (
                        <div key={index} className="flex gap-2 items-start border p-4 rounded-md">
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
                                <Input
                                    placeholder="Опис призу"
                                    value={prize.description}
                                    onChange={(e) => {
                                        const newPrizes = [...prizes]
                                        newPrizes[index].description = e.target.value
                                        setPrizes(newPrizes)
                                    }}
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
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" className="cursor-pointer" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Скасувати
                    </Button>
                    <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                        {isLoading ? "Збереження..." : mode === "create" ? "Створити" : "Зберегти"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
