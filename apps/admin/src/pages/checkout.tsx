"use client"

import type React from "react"

import { Layout } from "@/components/layout/layout.tsx"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, User, Package, Calendar, Trash2, RefreshCw } from "lucide-react"
import type { Member } from "@/components/members/types/member"
import type { Product } from "@/components/products/types/product"
import type { Activity } from "@/components/activities/types/activity"
import { searchMembers, searchProducts, searchActivities } from "@/components/checkout/api/api"
import InputMask from "react-input-mask"

import { useCart } from "@/hooks/use-cart"
import { CartSection } from "@/components/checkout/cart-section"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function CheckoutPage() {
  const { cartState, isCartUpdating, actions } = useCart()

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberSearch, setMemberSearch] = useState("+380")
  const [memberResults, setMemberResults] = useState<Member[]>([])
  const [showMemberResults, setShowMemberResults] = useState(false)

  const [itemSearch, setItemSearch] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [activityResults, setActivityResults] = useState<Activity[]>([])
  const [showItemResults, setShowItemResults] = useState(false)

  const debouncedItemSearch = useDebounce(itemSearch, 300)

  const handleMemberSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const cleanPhone = memberSearch.replace(/[^\d+]/g, "")

    if (cleanPhone.length < 4) {
      setMemberResults([])
      setShowMemberResults(false)
      return
    }

    const results = await searchMembers(cleanPhone)
    setMemberResults(results)
    setShowMemberResults(true)
  }

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member)
    setShowMemberResults(false)
    setMemberSearch("+380")

    // Let the backend know we switched member, it automatically handles loyalty
    await actions.setMember(member.memberId)
  }

  const handleRemoveMember = async () => {
    setSelectedMember(null)
    await actions.setMember(null)
  }

  const handleAddItem = async (entityId: string, type: "product" | "activity") => {
    await actions.addItem(entityId, type, 1)
    setItemSearch("")
    setShowItemResults(false)
  }

  useEffect(() => {
    const performItemSearch = async () => {
      if (debouncedItemSearch.length < 2) {
        setProductResults([])
        setActivityResults([])
        setShowItemResults(false)
        return
      }

      const [products, activities] = await Promise.all([
        searchProducts(debouncedItemSearch),
        searchActivities(debouncedItemSearch),
      ])
      setProductResults(products)
      setActivityResults(activities)
      setShowItemResults(true)
    }

    performItemSearch()
  }, [debouncedItemSearch])

  return (
    <Layout breadcrumbs={[{ label: "Каса", path: "/checkout" }]}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Оформлення каси</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => actions.flushCart()} disabled={isCartUpdating}>
              <Trash2 className="mr-2 h-4 w-4" />
              Очистити
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.refreshCart()} disabled={isCartUpdating}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Перерахувати
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Member Selection and Item Search */}
          <div className="space-y-6">
            {/* Member Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Учасник (необов'язково)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMember || cartState?.member?.memberId ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        {selectedMember ? (
                          <>
                            <p className="font-medium">
                              {selectedMember.firstName} {selectedMember.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{selectedMember.phone}</p>
                            <p className="text-sm text-muted-foreground">Баланс: {selectedMember.pointsBalance} балів</p>
                          </>
                        ) : cartState?.member ? (
                          <>
                            <p className="font-medium">
                              {cartState.member.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{cartState.member.phone}</p>
                            <p className="text-sm text-muted-foreground">Баланс: {cartState.member.pointsBalance} балів</p>
                          </>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveMember}
                      >
                        Змінити / Видалити
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <form onSubmit={handleMemberSearch} className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        {/* @ts-ignore - React 18 type mismatch */}
                        <InputMask
                          mask="+38 (099) 999-99-99"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Пошук учасника за номером телефону..."
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                      </div>
                      <Button type="submit" variant="secondary" size="sm" className="w-full">
                        <Search className="h-4 w-4 mr-2" />
                        Знайти учасника
                      </Button>
                    </form>
                    {showMemberResults && memberResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                        {memberResults.map((member) => (
                          <button
                            key={member.memberId}
                            className="w-full px-4 py-2 text-left hover:bg-accent"
                            onClick={() => handleSelectMember(member)}
                          >
                            <p className="font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.phone} • {member.pointsBalance} балів
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Item Search */}
            <Card>
              <CardHeader>
                <CardTitle>Додати товар або активність</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Пошук товарів або активностей..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      onFocus={() =>
                        (productResults.length > 0 || activityResults.length > 0) && setShowItemResults(true)
                      }
                      className="pl-9"
                    />
                  </div>
                  {showItemResults && (productResults.length > 0 || activityResults.length > 0) && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-96 overflow-y-auto">
                      {productResults.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50">Товари</div>
                          {productResults.map((product) => (
                            <button
                              key={product.productId}
                              className="w-full px-4 py-3 text-left hover:bg-accent border-b last:border-b-0"
                              onClick={() => handleAddItem(product.productId, "product")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{product.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{product.price} грн</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {activityResults.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                            Активності
                          </div>
                          {activityResults.map((activity) => (
                            <button
                              key={activity.activityId}
                              className="w-full px-4 py-3 text-left hover:bg-accent border-b last:border-b-0"
                              onClick={() => handleAddItem(activity.activityId, "activity")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{activity.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{activity.price} грн</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Cart */}
          <div className="relative">
            <CartSection
              cartState={cartState}
              isCartUpdating={isCartUpdating}
              actions={actions}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}
