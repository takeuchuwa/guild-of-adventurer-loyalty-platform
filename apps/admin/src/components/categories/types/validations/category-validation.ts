import { z } from "zod"

export const categorySchema = z.object({
    name: z
        .string()
        .min(1, "Назва категорії обов'язкова")
        .max(100, "Назва категорії не може перевищувати 100 символів")
        .trim(),
    kind: z
        .enum(["PRODUCT", "ACTIVITY"], { message: "Невірний тип категорії" })
        .refine((val) => val, { message: "Тип категорії обов'язковий" }),
})

export type CategoryFormData = z.infer<typeof categorySchema>
