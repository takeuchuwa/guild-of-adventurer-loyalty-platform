import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, Tag, Loader2, X } from "lucide-react"
import type { CartState } from "@/components/checkout/types/checkout"

interface CartSectionProps {
    cartState: CartState | null
    isCartUpdating: boolean
    actions: {
        updateQuantity: (itemId: string, newQuantity: number) => Promise<any>
        removeItem: (itemId: string) => Promise<any>
        applyPromo: (code?: string, promoId?: string) => Promise<any>
        rejectPromo: (promoId: string) => Promise<any>
        checkout: (expectedTotal: number) => Promise<any>
    }
}

export function CartSection({ cartState, isCartUpdating, actions }: CartSectionProps) {
    const [promoCode, setPromoCode] = useState("")

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
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Кошик</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">Кошик порожній або завантажується...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="relative overflow-hidden">
            {/* Global Loader Overlay */}
            {isCartUpdating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            <CardHeader>
                <CardTitle>Кошик</CardTitle>
            </CardHeader>

            <CardContent>
                {cartState.items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Кошик порожній</p>
                ) : (
                    <div className="space-y-4">

                        {/* Member Information Section */}
                        {cartState.member && (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-foreground">{cartState.member.name}</span>
                                    {cartState.member.levelName && <Badge variant="secondary" className="text-xs">{cartState.member.levelName}</Badge>}
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{cartState.member.phone || "Без номеру"}</span>
                                    <span>Бали: <span className="font-medium text-foreground">{cartState.member.pointsBalance}</span></span>
                                </div>
                            </div>
                        )}

                        {/* Cart Items List */}
                        {cartState.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg border p-4 gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate">{item.name || "Без назви"}</p>
                                        <Badge variant="outline" className="shrink-0">
                                            {item.type === "product" ? "Товар" : item.game ? `${item.game.name}` : "Активність"}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {item.discountAmount > 0 ? (
                                            <>
                                                <span className="line-through">{item.lineTotal.toFixed(2)} грн</span>
                                                {" → "}
                                                <span className="text-primary font-medium">{item.finalPrice.toFixed(2)} грн</span>
                                            </>
                                        ) : (
                                            <span>{item.lineTotal.toFixed(2)} грн</span>
                                        )}
                                        {" "}
                                        ({item.unitPrice.toFixed(2)} грн × {item.quantity})
                                    </p>
                                    {(item.pointsEarned ?? 0) > 0 && (
                                        <p className="text-sm text-green-600 font-medium mt-1">
                                            +{item.pointsEarned} XP
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-transparent"
                                            onClick={() => actions.updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-transparent"
                                            onClick={() => actions.updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => actions.removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Separator className="my-4" />

                        {/* Promotions Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Промокоди та Знижки
                            </h4>

                            <div className="flex flex-wrap gap-2">
                                {cartState.appliedPromos.map(promo => (
                                    <Badge key={promo.id} variant="default" className="flex items-center gap-1 py-1">
                                        {promo.name}
                                        <button
                                            onClick={() => actions.rejectPromo(promo.id)}
                                            className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}

                                {cartState.rejectedPromos.map(promo => (
                                    <Badge key={promo.id} variant="secondary" className="flex items-center gap-1 py-1 opacity-70">
                                        <span className="line-through">{promo.name}</span>
                                        <button
                                            onClick={() => actions.applyPromo(undefined as any, promo.id)}
                                            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>

                            <form onSubmit={handleApplyPromo} className="flex gap-2">
                                <Input
                                    placeholder="Введіть промокод..."
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                    className="h-9"
                                />
                                <Button type="submit" variant="secondary" size="sm" className="h-9">
                                    Застосувати
                                </Button>
                            </form>
                        </div>

                        <Separator className="my-4" />

                        {/* Totals Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between text-base">
                                <span>Підсумок:</span>
                                <span>{cartState.totals.subtotal.toFixed(2)} грн</span>
                            </div>

                            {cartState.totals.discountTotal > 0 && (
                                <div className="flex justify-between text-base text-primary">
                                    <span>Знижка:</span>
                                    <span>-{cartState.totals.discountTotal.toFixed(2)} грн</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-semibold">
                                <span>Всього до сплати:</span>
                                <span>{cartState.totals.finalTotal.toFixed(2)} грн</span>
                            </div>

                            {(cartState.totals.pointsExpected ?? 0) > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium text-green-600 bg-green-500/10 p-2 rounded-md mt-2 border border-green-500/20">
                                    <span>Досвід за покупку:</span>
                                    <span>+{cartState.totals.pointsExpected} XP</span>
                                </div>
                            )}

                            {(cartState.totals.bonusPoints ?? 0) > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium text-yellow-600 bg-yellow-500/10 p-2 rounded-md mt-2 border border-yellow-500/20">
                                    <span>Бонус від промо:</span>
                                    <span>+{cartState.totals.bonusPoints} XP</span>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full mt-4"
                            size="lg"
                            onClick={handleCheckout}
                        >
                            Підтвердити касу (Оплата)
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
