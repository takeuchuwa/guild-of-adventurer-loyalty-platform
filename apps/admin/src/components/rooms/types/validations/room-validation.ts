import { z } from "zod"

export const roomSchema = z.object({
    name: z.string().min(1, "Назва обов'язкова"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Невірний формат кольору (використовуйте #RRGGBB)"),
})

export type RoomFormData = z.infer<typeof roomSchema>
