import { z } from "zod"

export const memberUpdateSchema = z.object({
    firstName: z.string().trim().min(1, "Ім'я обов'язкове").max(255).nullable(),
    lastName: z.string().trim().min(1, "Прізвище обов'язкове").max(255).nullable(),
})

export const pointsAdjustmentSchema = z.object({
    points: z.number().int("Бали мають бути цілим числом"),
    reason: z.string().trim().min(1, "Причина обов'язкова").max(500),
})

export type MemberUpdateFormData = z.infer<typeof memberUpdateSchema>
export type PointsAdjustmentFormData = z.infer<typeof pointsAdjustmentSchema>
