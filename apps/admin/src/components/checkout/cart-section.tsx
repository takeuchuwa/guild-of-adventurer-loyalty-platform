import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Trash2, Loader2, X, AlertTriangle } from "lucide-react"
import type { CartState } from "@/components/checkout/types/checkout"
import { Overline } from "@/components/ui/typography"

interface CartSectionProps {
    cartState: CartState | null
    isCartUpdating: boolean
    /** True only while a cart is being fetched — an absent cart is not the same as a pending one. */
    isCartLoading: boolean
    /** The member block — rendered by the page so the QR scanner can feed it too. */
    memberPanel?: React.ReactNode
    actions: {
        updateQuantity: (itemId: string, newQuantity: number) => Promise<any>
        removeItem: (itemId: string) => Promise<any>
        applyPromo: (code?: string, promoId?: string) => Promise<any>
        rejectPromo: (promoId: string) => Promise<any>
        checkout: (expectedTotal: number) => Promise<any>
    }
}

function MoneyRow({ label, value, tone }: { label: string; value: string; tone?: "muted" | "gold" | "blood" }) {
    const valueClass =
        tone === "gold" ? "text-accent-bright" : tone === "blood" ? "text-destructive" : "text-foreground/80"
    return (
        <div className="text-foreground/65 flex justify-between gap-4 text-[14px]">
            <span>{label}</span>
            <span className={`font-mono text-[13.5px] font-medium ${valueClass}`}>{value}</span>
        </div>
    )
}

export function CartSection({ cartState, isCartUpdating, isCartLoading, actions, memberPanel }: CartSectionProps) {
    const [promoCode, setPromoCode] = useState("")
    const [receivedAmount, setReceivedAmount] = useState<number>(0)

    useEffect(() => {
        setReceivedAmount(0)
    }, [cartState?.totals.finalTotal])

    const handleApplyPromo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!promoCode.trim()) return
        await actions.applyPromo(promoCode.trim())
        setPromoCode("")
    }

    const handleCheckout = async () => {
        if (!cartState) return
        await actions.checkout(cartState.totals.finalTotal)
    }

    if (!cartState) {
        return (
            <div className="bg-surface-alt flex h-full flex-col items-center justify-center border-l border-[rgba(201,158,58,.22)] p-6">
                {isCartLoading ? (
                    <p className="text-muted-foreground flex items-center gap-2 text-center">
                        <Loader2 className="h-4 w-4 animate-spin" /> Завантаження кошика...
                    </p>
                ) : (
                    <p className="text-muted-foreground text-center">
                        Не вдалося завантажити кошик. Оновіть сторінку.
                    </p>
                )}
            </div>
        )
    }

    const hasShortage = cartState.items.some(
        (item) => item.type === "product" && item.inventory !== -1 && item.quantity > (item.inventory ?? 0),
    )

    return (
        <div className="bg-surface-alt relative flex h-full min-h-0 flex-col border-l border-[rgba(201,158,58,.22)]">
            {isCartUpdating && (
                <div className="bg-background/60 absolute inset-0 z-50 flex items-center justify-center">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
            )}

            {memberPanel}

            {cartState.items.length === 0 ? (
                <p className="text-muted-foreground flex-1 px-6 py-10 text-center">Кошик порожній</p>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {cartState.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3.5 border-b border-[rgba(201,158,58,.08)] px-6 py-4"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-[14.5px] font-semibold">{item.name || "Без назви"}</p>
                                    <span className="text-foreground/45 shrink-0 border border-[rgba(237,230,216,.15)] px-1.5 py-[2px] font-heading text-[10.5px] font-semibold uppercase tracking-[.1em]">
                                        {item.type === "donation" ? "Донат" : item.type === "product" ? "Товар" : item.game ? `${item.game.name}` : "Активність"}
                                    </span>
                                </div>

                                {item.type === "donation" ? (
                                    <p className="text-foreground/50 mt-1 font-mono text-[11.5px]">
                                        {item.unitPrice.toFixed(2)} грн · {item.donation?.pointsPercent ?? 0}% у бали
                                        {item.donation?.activityName && <> · {item.donation.activityName}</>}
                                    </p>
                                ) : (
                                    <p className="text-foreground/50 mt-1 font-mono text-[11.5px]">
                                        {item.unitPrice.toFixed(2)} грн × {item.quantity}
                                        {item.discountAmount > 0 && (
                                            <>
                                                {" · "}
                                                <span className="line-through">{item.lineTotal.toFixed(2)}</span>{" "}
                                                <span className="text-accent-bright">{item.finalPrice.toFixed(2)} грн</span>
                                            </>
                                        )}
                                        {item.type === "product" && (
                                            <>
                                                {" · склад: "}
                                                {item.inventory === -1 ? "необмежено" : `${item.inventory} шт.`}
                                            </>
                                        )}
                                    </p>
                                )}

                                {(item.pointsEarned ?? 0) > 0 && (
                                    <p className="text-accent-bright mt-1 font-mono text-[11px]">+{item.pointsEarned} XP</p>
                                )}
                                {item.type === "product" && item.inventory !== -1 && item.inventory === 0 && (
                                    <p className="text-destructive mt-1.5 flex items-center gap-1 text-[12.5px]">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        Немає в наявності на складі
                                    </p>
                                )}
                                {item.type === "product" && item.inventory !== -1 && item.inventory > 0 && item.quantity > item.inventory && (
                                    <p className="text-brass mt-1.5 flex items-center gap-1 text-[12.5px]">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        Недостатньо на складі (доступно: {item.inventory} шт.)
                                    </p>
                                )}
                            </div>

                            {item.type === "donation" ? (
                                // Same footprint as the stepper so the price column stays aligned.
                                <div className="w-[92px] shrink-0" />
                            ) : (
                                <div className="flex shrink-0 items-center gap-2 font-mono text-[13px]">
                                    <button
                                        type="button"
                                        className="text-foreground/60 flex size-[26px] cursor-pointer items-center justify-center border border-[rgba(237,230,216,.18)] transition-colors hover:text-foreground"
                                        onClick={() => actions.updateQuantity(item.id, item.quantity - 1)}
                                        aria-label="Менше"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <button
                                        type="button"
                                        className="text-primary flex size-[26px] cursor-pointer items-center justify-center border border-[rgba(201,158,58,.4)] transition-colors hover:bg-accent"
                                        onClick={() => actions.updateQuantity(item.id, item.quantity + 1)}
                                        aria-label="Більше"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="w-[74px] shrink-0 text-right font-mono text-[15px] font-bold">
                                {item.finalPrice.toFixed(2)}
                            </div>

                            <button
                                type="button"
                                className="text-foreground/35 shrink-0 cursor-pointer transition-colors hover:text-destructive"
                                onClick={() => actions.removeItem(item.id)}
                                aria-label="Прибрати"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {cartState.items.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[rgba(201,158,58,.22)] px-6 py-5">
                    <Overline>Промокоди та знижки</Overline>

                    {(cartState.appliedPromos.length > 0 || cartState.rejectedPromos.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                            {cartState.appliedPromos.map((promo) => (
                                <span
                                    key={promo.id}
                                    className="text-accent-bright flex items-center gap-2 border border-[rgba(201,158,58,.45)] bg-[rgba(201,158,58,.07)] px-2.5 py-1 text-[12.5px] font-medium"
                                >
                                    {promo.name}
                                    <button
                                        onClick={() => actions.rejectPromo(promo.id)}
                                        className="cursor-pointer transition-colors hover:text-destructive"
                                        aria-label="Прибрати промокод"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}

                            {cartState.rejectedPromos.map((promo) => (
                                <span
                                    key={promo.id}
                                    className="text-foreground/45 flex items-center gap-2 border border-[rgba(237,230,216,.15)] px-2.5 py-1 text-[12.5px] font-medium"
                                >
                                    <span className="line-through">{promo.name}</span>
                                    <button
                                        onClick={() => actions.applyPromo(undefined as any, promo.id)}
                                        className="cursor-pointer transition-colors hover:text-primary"
                                        aria-label="Застосувати промокод"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <Input
                            placeholder="Введіть промокод..."
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="h-[38px] font-mono text-[13px]"
                        />
                        <Button type="submit" variant="secondary" size="sm" className="h-[38px] cursor-pointer">
                            Застосувати
                        </Button>
                    </form>
                </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[rgba(201,158,58,.22)] px-6 py-5">
                <MoneyRow label="Підсумок" value={`${cartState.totals.subtotal.toFixed(2)} грн`} />

                {cartState.totals.discountTotal > 0 && (
                    <MoneyRow label="Знижка" value={`−${cartState.totals.discountTotal.toFixed(2)} грн`} tone="blood" />
                )}

                {(cartState.totals.pointsExpected ?? 0) > 0 && (
                    <MoneyRow label="Досвід за покупку" value={`+${cartState.totals.pointsExpected} XP`} tone="gold" />
                )}

                {(cartState.totals.bonusPoints ?? 0) > 0 && (
                    <MoneyRow label="Бонус від промо" value={`+${cartState.totals.bonusPoints} XP`} tone="gold" />
                )}

                <div className="my-1 h-px bg-[rgba(201,158,58,.22)]" />

                <div className="flex items-baseline justify-between">
                    <span className="font-heading text-[20px] uppercase tracking-[.1em]">Всього до сплати</span>
                    <span className="text-accent-bright font-mono text-[30px] font-bold">
                        {cartState.totals.finalTotal.toFixed(2)} грн
                    </span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                    <label htmlFor="received-amount" className="text-foreground/85 text-[13.5px] font-semibold">
                        Отримано від клієнта (грн):
                    </label>
                    <Input
                        id="received-amount"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Введіть суму..."
                        value={receivedAmount === 0 ? "" : receivedAmount}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setReceivedAmount(val)
                        }}
                        className="h-[42px] font-mono"
                    />
                </div>

                {receivedAmount > 0 && (
                    <div
                        className={`flex items-center justify-between gap-4 border px-3 py-2.5 text-[13.5px] ${receivedAmount >= cartState.totals.finalTotal
                            ? "border-[rgba(201,158,58,.4)] bg-[rgba(201,158,58,.07)] text-accent-bright"
                            : "border-[rgba(126,43,33,.6)] text-destructive"
                            }`}
                    >
                        <span>Решта:</span>
                        <span className="font-mono">
                            {receivedAmount >= cartState.totals.finalTotal
                                ? `${(receivedAmount - cartState.totals.finalTotal).toFixed(2)} грн`
                                : `Недостатньо (ще потрібно: ${(cartState.totals.finalTotal - receivedAmount).toFixed(2)} грн)`}
                        </span>
                    </div>
                )}

                {hasShortage && (
                    <div className="text-brass flex items-start gap-2 border border-[rgba(138,106,30,.5)] px-3 py-2.5 text-[12px]">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Увага: Недостатньо товару на складі</p>
                            <p className="mt-0.5 leading-relaxed">
                                Замовлена кількість перевищує наявну на складі. Продаж буде здійснено, залишок товару буде списано до 0.
                            </p>
                        </div>
                    </div>
                )}

                <Button
                    className="mt-1 h-14 w-full cursor-pointer text-[17px] tracking-[.14em]"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cartState.items.length === 0}
                >
                    Прийняти оплату
                </Button>
            </div>
        </div>
    )
}
