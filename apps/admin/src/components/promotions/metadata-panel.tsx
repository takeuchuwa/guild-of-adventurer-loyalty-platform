"use client"

import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Infinity } from "lucide-react"

export function MetadataPanel() {
    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useFormContext()

    const mode = watch("mode")
    const active = watch("active")
    const combinable = watch("combinable")
    const startDate = watch("startDate")
    const endDate = watch("endDate")
    const isPermanent = watch("isPermanent")
    const usageRemaining = watch("usageRemaining")
    const isUnlimited = usageRemaining === null || usageRemaining === undefined

    return (
        <div className="flex flex-col gap-6">
            {/* Card 1: Basic Info */}
            <div className="border rounded-lg bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Основна інформація</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Назва <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register("name", { required: "Назва обов'язкова" })}
                            placeholder="Введіть назву промоакції"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message?.toString()}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Опис</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Введіть опис промоакції"
                            rows={3}
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label htmlFor="priority">Пріоритет</Label>
                        <Input
                            id="priority"
                            type="number"
                            min={0}
                            {...register("priority", {
                                valueAsNumber: true,
                            })}
                            placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">
                            Вищий пріоритет (нижче число) застосовується першим при збігу кількох промоакцій
                        </p>
                        {errors.priority && (
                            <p className="text-sm text-destructive">{errors.priority.message?.toString()}</p>
                        )}
                    </div>

                    {/* Usage Remaining */}
                    <div className="space-y-2">
                        <Label htmlFor="usageRemaining">Ліміт використань</Label>

                        {/* Unlimited toggle */}
                        <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                                id="usageUnlimited"
                                checked={isUnlimited}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setValue("usageRemaining", null, { shouldDirty: true })
                                    } else {
                                        setValue("usageRemaining", 1, { shouldDirty: true })
                                    }
                                }}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="usageUnlimited" className="cursor-pointer text-sm font-normal flex items-center gap-1">
                                <Infinity className="h-4 w-4" />
                                Необмежено
                            </Label>
                        </div>

                        {!isUnlimited && (
                            <Input
                                id="usageRemaining"
                                type="number"
                                min={1}
                                {...register("usageRemaining", {
                                    valueAsNumber: true,
                                })}
                                placeholder="100"
                            />
                        )}
                        {errors.usageRemaining && (
                            <p className="text-sm text-destructive">{errors.usageRemaining.message?.toString()}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={active}
                                onCheckedChange={(checked) => setValue("active", checked)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="active" className="cursor-pointer">
                                Активна
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="combinable"
                                checked={combinable}
                                onCheckedChange={(checked) => setValue("combinable", checked)}
                                className="cursor-pointer"
                            />
                            <Label htmlFor="combinable" className="cursor-pointer">
                                Комбінується
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Trigger & Schedule */}
            <div className="border rounded-lg bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Тригер і розклад</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>
                            Режим <span className="text-destructive">*</span>
                        </Label>
                        <RadioGroup
                            value={mode}
                            onValueChange={(value) => setValue("mode", value)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AUTO" id="mode-auto" className="cursor-pointer" />
                                <Label htmlFor="mode-auto" className="cursor-pointer font-normal">
                                    Автоматичний
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="COUPON" id="mode-coupon" className="cursor-pointer" />
                                <Label htmlFor="mode-coupon" className="cursor-pointer font-normal">
                                    Код купона
                                </Label>
                            </div>
                        </RadioGroup>
                        {errors.mode && (
                            <p className="text-sm text-destructive">{errors.mode.message?.toString()}</p>
                        )}
                    </div>

                    {mode === "COUPON" && (
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Код купона <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="code"
                                {...register("code", {
                                    required: mode === "COUPON" ? "Код обов'язковий для купонів" : false,
                                    pattern: {
                                        value: /^[A-Z0-9]+$/,
                                        message: "Тільки великі літери та цифри",
                                    },
                                })}
                                placeholder="SUMMER20"
                                className="uppercase"
                                onChange={(e) => setValue("code", e.target.value.toUpperCase())}
                            />
                            {errors.code && (
                                <p className="text-sm text-destructive">{errors.code.message?.toString()}</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className={isPermanent ? "text-muted-foreground" : ""}>
                                Дата початку {!isPermanent && <span className="text-destructive">*</span>}
                            </Label>
                            <DateTimePicker
                                value={startDate === -1 ? undefined : startDate}
                                onChange={(value) => setValue("startDate", value ?? -1)}
                                error={errors.startDate?.message?.toString()}
                                disabled={isPermanent}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate" className={isPermanent ? "text-muted-foreground" : ""}>
                                Дата завершення {!isPermanent && <span className="text-destructive">*</span>}
                            </Label>
                            <DateTimePicker
                                value={endDate === -1 ? undefined : endDate}
                                onChange={(value) => setValue("endDate", value ?? -1)}
                                error={errors.endDate?.message?.toString()}
                                disabled={isPermanent}
                            />
                            <p className="text-xs text-muted-foreground">Має бути пізніше дати початку</p>
                        </div>
                    </div>
                    {/* isPermanent checkbox */}
                    <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                            id="isPermanent"
                            checked={isPermanent}
                            onCheckedChange={(checked) => {
                                setValue("isPermanent", checked, { shouldValidate: true })
                                if (checked) {
                                    setValue("startDate", -1, { shouldValidate: true })
                                    setValue("endDate", -1, { shouldValidate: true })
                                } else {
                                    const now = Math.floor(Date.now() / 1000)
                                    setValue("startDate", now, { shouldValidate: true })
                                    setValue("endDate", now + 7 * 24 * 60 * 60, { shouldValidate: true })
                                }
                            }}
                            className="cursor-pointer"
                        />
                        <Label htmlFor="isPermanent" className="cursor-pointer text-sm font-normal">
                            Постійна промоакція (без обмежень у часі)
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    )
}
