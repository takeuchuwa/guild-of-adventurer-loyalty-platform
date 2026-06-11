import { z } from "zod"

export const roomSchema = z.object({
    name: z
        .string()
        .min(1, "Назва кімнати обов'язкова")
        .max(100, "Назва кімнати не може перевищувати 100 символів")
        .trim(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Невірний формат кольору (використовуйте #RRGGBB)"),
})

export type RoomFormData = z.infer<typeof roomSchema>
