import { z } from "zod"

export const gameSchema = z.object({
    name: z.string().min(1, "Назва ігрової системи обов'язкова").max(100, "Назва ігрової системи не може перевищувати 100 символів").trim(),
    description: z.string().max(1000, "Опис не може перевищувати 1000 символів").trim().optional().or(z.literal("")),
})

export type GameFormData = z.infer<typeof gameSchema>
