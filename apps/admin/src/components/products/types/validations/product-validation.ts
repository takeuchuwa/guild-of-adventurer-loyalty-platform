import { z } from "zod"

export const productSchema = z.object({
    name: z
        .string()
        .min(1, "Назва продукту обов'язкова")
        .max(100, "Назва продукту не може перевищувати 100 символів")
        .trim(),
    sku: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || /^\d{11}$/.test(val), "SKU має містити рівно 11 цифр"),
    price: z
        .number({
            error: (issue) => {
                if (issue.code === "invalid_type") {
                    return "Ціна має бути числом"
                }
                return "Неправильний формат числа"
            },
        })
        .min(0, "Ціна не може бути від'ємною")
        .default(0),
    overridePoints: z
        .number()
        .int("Бали мають бути цілим числом")
        .min(0, "Бали не можуть бути від'ємними")
        .nullable()
        .optional(),
    categoryIds: z.array(z.string()).min(1, "Оберіть хоча б одну категорію"),
})

export type ProductFormData = z.infer<typeof productSchema>
