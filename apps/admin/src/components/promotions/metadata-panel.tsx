"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AiTextarea } from "@/components/ui/ai-textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Infinity, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react"

import { getPromoResumeText } from "./utils/promo-helper"

interface MetadataPanelProps {
    levels?: { levelId: string; name: string }[]
}

export function MetadataPanel({ levels = [] }: MetadataPanelProps) {
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
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Calculate promo resume
    const config = watch("config")
    const levelAssignments = watch("levelAssignments") || []
    const memberIds = watch("assignments.memberIds") || []
    const promoResume = getPromoResumeText(config, levels, levelAssignments, memberIds)

    // Count non-default advanced settings to hint user
    const advancedBadgeCount = [
        watch("priority") !== 0 && watch("priority") !== undefined,
        combinable === false,
        !isUnlimited,
    ].filter(Boolean).length

    return (
        <div className="flex flex-col gap-6">
            {/* Card 1: Basic Info */}
            <div className="border rounded-lg bg-surface shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Основна інформація</h3>
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
                        <AiTextarea
                            id="description"
                            {...register("description")}
                            placeholder="Введіть опис промоакції"
                            rows={3}
                            entityType="promotion"
                            entityName={watch("name")}
                            getContextConfig={() => watch("config")}
                            promoResume={promoResume}
                        />
                    </div>

                    {/* Active toggle */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Switch
                                id="active"
                                checked={active}
                                onCheckedChange={(checked) => setValue("active", checked)}
                                className="cursor-pointer"
                            />
                            <div>
                                <Label htmlFor="active" className="cursor-pointer font-medium">
                                    Активна
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Лише активні промоакції беруть участь у розрахунку кошика
                                </p>
                            </div>
                        </div>
                        {!active && (
                            <div className="flex items-start gap-2 rounded-md border border-[rgba(138,106,30,.5)] bg-[rgba(138,106,30,.12)] px-3 py-2.5 text-sm text-brass">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-brass" />
                                <span>Промоакція вимкнена і <strong>не застосовуватиметься</strong> при оформленні замовлень. Увімкніть її, щоб вона почала діяти.</span>
                            </div>
                        )}
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(v => !v)}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                        >
                            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>Розширені налаштування</span>
                            {advancedBadgeCount > 0 && !showAdvanced && (
                                <span className="ml-1 text-[11px] px-1.5 py-0.5 bg-primary/10 text-primary font-medium">
                                    {advancedBadgeCount}
                                </span>
                            )}
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Пріоритет</Label>
                                    <Select
                                        value={String(watch("priority") ?? 5)}
                                        onValueChange={(val) => setValue("priority", Number(val), { shouldDirty: true })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Оберіть пріоритет" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">
                                                <span className="flex items-center gap-2">Найвищий</span>
                                            </SelectItem>
                                            <SelectItem value="1">
                                                <span className="flex items-center gap-2">Високий</span>
                                            </SelectItem>
                                            <SelectItem value="5">
                                                <span className="flex items-center gap-2">Нормальний</span>
                                            </SelectItem>
                                            <SelectItem value="10">
                                                <span className="flex items-center gap-2">Низький</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        При збігу кількох промоакцій, першою застосовується та, що має вищий пріоритет
                                    </p>
                                    {errors.priority && (
                                        <p className="text-sm text-destructive">{errors.priority.message?.toString()}</p>
                                    )}
                                </div>

                                {/* Combinable toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="combinable"
                                            checked={combinable}
                                            onCheckedChange={(checked) => setValue("combinable", checked)}
                                            className="cursor-pointer"
                                        />
                                        <div>
                                            <Label htmlFor="combinable" className="cursor-pointer font-medium">
                                                Комбінується з іншими
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {combinable
                                                    ? "Застосовується завжди, навіть якщо вже діє інша некомбінована промоакція"
                                                    : "Серед некомбінованих промоакцій спрацює лише одна — з найвищим пріоритетом"}
                                            </p>
                                        </div>
                                    </div>
                                    {!combinable && (
                                        <div className="flex items-start gap-2 rounded-md border border-[rgba(201,158,58,.35)] bg-[rgba(201,158,58,.07)] px-3 py-2.5 text-sm text-primary">
                                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                            <span>Якщо кілька некомбінованих промоакцій одночасно активні, система застосує лише ту, що має <strong>вищий пріоритет</strong>. Комбіновані промоакції при цьому продовжують діяти.</span>
                                        </div>
                                    )}
                                    {combinable && (
                                        <div className="flex items-start gap-2 rounded-md border border-[rgba(201,158,58,.35)] bg-[rgba(201,158,58,.07)] px-3 py-2.5 text-sm text-accent-bright">
                                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-accent-bright" />
                                            <span>Ця промоакція <strong>завжди застосовується</strong> разом з іншими — вона не блокує інші знижки і не блокується ними.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Usage Remaining */}
                                <div className="space-y-2">
                                    <Label htmlFor="usageRemaining">Ліміт використань</Label>
                                    <div className="flex items-center gap-2">
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
                                            {...register("usageRemaining", { valueAsNumber: true })}
                                            placeholder="100"
                                        />
                                    )}
                                    {errors.usageRemaining && (
                                        <p className="text-sm text-destructive">{errors.usageRemaining.message?.toString()}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card 2: Trigger & Schedule */}
            <div className="border rounded-lg bg-surface shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Режим та розклад</h3>
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
                                <div>
                                    <Label htmlFor="mode-auto" className="cursor-pointer font-normal">
                                        Автоматичний
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Застосовується автоматично при складанні замовлення</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="COUPON" id="mode-coupon" className="cursor-pointer" />
                                <div>
                                    <Label htmlFor="mode-coupon" className="cursor-pointer font-normal">
                                        Купон
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Клієнт вводить код при оформленні</p>
                                </div>
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

                    {/* isPermanent checkbox */}
                    <div className="flex items-center gap-2">
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
                            Безстрокова (без дат початку і завершення)
                        </Label>
                    </div>

                    {!isPermanent && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">
                                    Дата початку <span className="text-destructive">*</span>
                                </Label>
                                <DateTimePicker
                                    value={startDate === -1 ? undefined : startDate}
                                    onChange={(value) => setValue("startDate", value ?? -1)}
                                    error={errors.startDate?.message?.toString()}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">
                                    Дата завершення <span className="text-destructive">*</span>
                                </Label>
                                <DateTimePicker
                                    value={endDate === -1 ? undefined : endDate}
                                    onChange={(value) => setValue("endDate", value ?? -1)}
                                    error={errors.endDate?.message?.toString()}
                                />
                                <p className="text-xs text-muted-foreground">Має бути пізніше дати початку</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
