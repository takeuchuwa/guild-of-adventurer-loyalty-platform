import { z } from "zod"

export const gameSchema = z.object({
    name: z.string().min(1, "Назва гри обов'язкова").max(100, "Назва гри не може перевищувати 100 символів").trim(),
    description: z.string().max(255, "Опис не може перевищувати 255 символів").trim().optional().or(z.literal("")),
})

export type GameFormData = z.infer<typeof gameSchema>
