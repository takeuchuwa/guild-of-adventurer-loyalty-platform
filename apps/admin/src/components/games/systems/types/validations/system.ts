import { z } from "zod"

export const systemSchema = z.object({
    name: z
        .string()
        .min(1, "Назва системи обов'язкова")
        .max(100, "Назва системи не може перевищувати 100 символів")
        .trim(),
    description: z.string().max(255, "Опис не може перевищувати 255 символів").trim().optional().or(z.literal("")),
})

export type SystemFormData = z.infer<typeof systemSchema>
