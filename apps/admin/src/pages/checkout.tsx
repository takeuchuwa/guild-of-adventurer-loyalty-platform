"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Package, Calendar, Trash2, RefreshCw, Loader2, QrCode, AlertCircle, ChevronLeft, ChevronRight, HandCoins } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Overline } from "@/components/ui/typography"
import type { Member } from "@/components/members/types/member"
import type { Product } from "@/components/products/types/product"
import type { Activity } from "@/components/activities/types/activity"
import type { Category } from "@/components/categories/types/category-types"
import { searchProducts, searchActivities, verifyMemberQR } from "@/components/checkout/api/api"
import { fetchCategoriesByKind } from "@/components/categories/api/category-api"
import { fetchProducts } from "@/components/products/api/products-api"
import { fetchActivities } from "@/components/activities/api/activity-api"
import { useNavigate, useLocation } from "react-router-dom"

import { useCart } from "@/hooks/use-cart"
import { CartSection } from "@/components/checkout/cart-section"
import { MemberPanel } from "@/components/checkout/member-panel"
import { DonationDialog } from "@/components/checkout/donation-dialog"
import { ItemGrid, type CheckoutItemType, type GridItem } from "@/components/checkout/item-grid"
import { useRecentItems } from "@/hooks/use-recent-items"
import { useHardwareScanner } from "@/hooks/useHardwareScanner"

const ALL_CATEGORIES = "__all__"
const GRID_PAGE_SIZE = 20

function productToGridItem(product: Product): GridItem {
  return {
    id: product.productId,
    type: "product",
    name: product.name ?? "",
    price: product.price,
    inventory: product.inventory,
  }
}

function activityToGridItem(activity: Activity): GridItem {
  return {
    id: activity.activityId,
    type: "activity",
    name: activity.name,
    price: activity.price,
    startDate: activity.startDate,
  }
}

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

/** Status pill for the scanner state. */
function ScannerBadge({
  scanStatus,
  isInputActive,
}: {
  scanStatus: "idle" | "loading" | "success" | "error"
  isInputActive: boolean
}) {
  if (scanStatus === "loading") {
    return (
      <span className="text-primary flex shrink-0 items-center gap-2 border border-[rgba(201,158,58,.4)] px-2 py-1 font-heading text-[11px] font-semibold uppercase tracking-[.12em]">
        <Loader2 className="h-3 w-3 animate-spin" /> ОБРОБКА...
      </span>
    )
  }
  if (scanStatus === "error") {
    return (
      <span className="text-destructive shrink-0 border border-[rgba(126,43,33,.7)] px-2 py-1 font-heading text-[11px] font-semibold uppercase tracking-[.12em]">
        ПОМИЛКА СКАНУВАННЯ
      </span>
    )
  }
  if (scanStatus === "success") {
    return (
      <span className="text-accent-bright shrink-0 border border-[rgba(201,158,58,.5)] px-2 py-1 font-heading text-[11px] font-semibold uppercase tracking-[.12em]">
        УСПІШНО
      </span>
    )
  }
  if (isInputActive) {
    return (
      <span className="text-foreground/45 flex shrink-0 items-center gap-2 border border-[rgba(237,230,216,.18)] px-2 py-1 font-heading text-[11px] font-semibold uppercase tracking-[.12em]">
        <AlertCircle className="h-3 w-3" /> СКАНЕР ВИМКНЕНО
      </span>
    )
  }
  return (
    <span className="text-primary flex shrink-0 items-center gap-2 border border-[rgba(201,158,58,.4)] px-2 py-1 font-heading text-[11px] font-semibold uppercase tracking-[.12em]">
      <QrCode className="h-3 w-3" /> СКАНЕР ГОТОВИЙ
    </span>
  )
}

export default function CheckoutPage() {
  const { cartState, isCartUpdating, isCartLoading, actions } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isDonationOpen, setIsDonationOpen] = useState(false)

  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scanError, setScanError] = useState('');

  const [itemSearch, setItemSearch] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [activityResults, setActivityResults] = useState<Activity[]>([])
  const [showItemResults, setShowItemResults] = useState(false)

  // Browse block: what kind of thing we are listing, its categories, and where
  // we are in its cursor-paginated pages.
  const [browseType, setBrowseType] = useState<CheckoutItemType>("product")
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES)
  const [gridItems, setGridItems] = useState<GridItem[]>([])
  const [isGridLoading, setIsGridLoading] = useState(false)

  /** Cursor of the page on screen; `null` is the first page. */
  const [cursor, setCursor] = useState<string | null>(null)
  /** Cursors of the pages behind us, so «назад» does not need a page index. */
  const [prevCursors, setPrevCursors] = useState<(string | null)[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  const { recent, remember } = useRecentItems()

  const { isInputActive } = useHardwareScanner(async (scannedData) => {
    setScanStatus('loading');
    setScanError('');
    try {
      const parsedData = JSON.parse(scannedData);
      if (parsedData.type !== 'member') {
        throw new Error('Очікується QR-код учасника — цей код не відповідного типу.');
      }
      const member = await verifyMemberQR(parsedData);
      handleSelectMember(member);
      setScanStatus('success');
      setTimeout(() => setScanStatus('idle'), 2000);
    } catch (err: any) {
      console.error(err);
      setScanStatus('error');
      setScanError(err.message || 'Невірний QR-код учасника.');
      setTimeout(() => setScanStatus('idle'), 3000);
    }
  });

  const debouncedItemSearch = useDebounce(itemSearch, 300)

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member)

    // Let the backend know we switched member, it automatically handles loyalty
    await actions.setMember(member.memberId)
  }

  const handleRemoveMember = async () => {
    setSelectedMember(null)
    await actions.setMember(null)
  }

  /**
   * `item` is passed whenever the caller knows the full tile — search results and
   * both grids do; the return-from-create redirect only knows the id, and that
   * one entry simply does not join the recent strip until it is used again.
   */
  const handleAddItem = async (entityId: string, type: CheckoutItemType, item?: GridItem) => {
    await actions.addItem(entityId, type, 1)
    if (item) remember(item)
    setItemSearch("")
    setShowItemResults(false)
  }

  const resetPaging = () => {
    setCursor(null)
    setPrevCursors([])
  }

  const handleBrowseTypeChange = (value: string) => {
    setBrowseType(value as CheckoutItemType)
    setActiveCategory(ALL_CATEGORIES)
    resetPaging()
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    resetPaging()
  }

  const goToNextPage = () => {
    if (!hasNextPage) return
    setPrevCursors((prev) => [...prev, cursor])
    setCursor(nextCursor)
  }

  const goToPrevPage = () => {
    if (prevCursors.length === 0) return
    setCursor(prevCursors[prevCursors.length - 1])
    setPrevCursors((prev) => prev.slice(0, -1))
  }

  const addedItemRef = useRef<string | null>(null)

  // Handle return from creation pages with an item to add
  useEffect(() => {
    if (location.state?.addItem) {
      const { id, type } = location.state.addItem
      if (id && type && addedItemRef.current !== id) {
        addedItemRef.current = id
        handleAddItem(id, type)
      }
      // Clear the state so it doesn't trigger again on refresh
      navigate(".", { replace: true, state: {} })
    }
  }, [location.state, navigate, actions])

  // Clear local selectedMember state when cart member is cleared (e.g., checkout or flush)
  useEffect(() => {
    if (!cartState?.member?.memberId) {
      setSelectedMember(null)
    }
  }, [cartState?.member?.memberId])

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

  // Category chips follow the selected type — product categories and activity
  // categories are separate kinds server-side.
  useEffect(() => {
    let active = true
    fetchCategoriesByKind(browseType === "product" ? "PRODUCT" : "ACTIVITY")
      .then((res) => {
        if (active) setCategories(res.categories || [])
      })
      .catch((error) => console.error("Error loading checkout categories:", error))

    return () => {
      active = false
    }
  }, [browseType])

  // The grid itself — one cursor page of the selected type, filtered by category.
  useEffect(() => {
    let active = true
    setIsGridLoading(true)

    const filterParams = activeCategory === ALL_CATEGORIES ? {} : { categoryId: activeCategory }
    const pagination = { pageSize: GRID_PAGE_SIZE, cursor }

    const request =
      browseType === "product"
        ? fetchProducts({ pagination, sorting: [], filterParams }).then((res) => ({
          items: (res.products || []).map(productToGridItem),
          pagination: res.pagination,
        }))
        : fetchActivities({ pagination, sorting: [], filterParams }).then((res) => ({
          items: (res.activities || []).map(activityToGridItem),
          pagination: res.pagination,
        }))

    request
      .then(({ items, pagination: page }) => {
        if (!active) return
        setGridItems(items)
        setNextCursor(page.nextCursor)
        setHasNextPage(page.hasNextPage)
      })
      .finally(() => {
        if (active) setIsGridLoading(false)
      })

    return () => {
      active = false
    }
  }, [browseType, activeCategory, cursor])

  const attachedMember =
    cartState?.member ??
    (selectedMember
      ? {
        memberId: selectedMember.memberId,
        name: `${selectedMember.firstName ?? ""} ${selectedMember.lastName ?? ""}`.trim(),
        phone: selectedMember.phone,
        pointsBalance: selectedMember.pointsBalance,
        levelId: selectedMember.levelId,
      }
      : undefined)

  return (
    <Layout breadcrumbs={[{ label: "Каса", path: "/checkout" }]}>
      {/*
        Rail width is fluid: a share of the viewport, floored so it stays usable
        and capped at 50rem so it does not sprawl on a 4K panel. A fixed width
        cannot serve both a laptop and a 4K monitor — 38rem is a third of a
        MacBook and a sixth of a 4K screen.
      */}
      <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[1fr_clamp(22rem,30vw,50rem)]">
        <div className="flex min-w-0 flex-col gap-5 p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-heading text-[40px] leading-none font-bold uppercase tracking-[.03em]">Каса</h1>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsDonationOpen(true)} disabled={isCartUpdating || !cartState} className="cursor-pointer">
                <HandCoins className="mr-2 h-4 w-4" />
                Донат
              </Button>
              <Button variant="outline" size="sm" onClick={() => actions.refreshCart()} disabled={isCartUpdating} className="cursor-pointer">
                <RefreshCw className="mr-2 h-4 w-4" />
                Перерахувати суми
              </Button>
              <Button variant="destructiveOutline" size="sm" onClick={() => actions.flushCart()} disabled={isCartUpdating} className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Очистити кошик
              </Button>
            </div>
          </div>

          {/* Scanner-first search bar */}
          <div className="relative">
            <div className="border-primary bg-surface flex h-[52px] items-center gap-3 border-2 px-4">
              <Search className="text-primary h-4 w-4 shrink-0" />
              <input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                onFocus={() => (productResults.length > 0 || activityResults.length > 0) && setShowItemResults(true)}
                placeholder="Скануй штрихкод або шукай товар…"
                className="placeholder:text-foreground/45 h-full w-full bg-transparent font-mono text-[14px] outline-none"
              />
              <ScannerBadge scanStatus={scanStatus} isInputActive={isInputActive} />
            </div>

            {showItemResults && (
              <div className="bg-surface border-hairline absolute z-10 mt-1 max-h-96 w-full overflow-y-auto border">
                {productResults.length === 0 && activityResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
                    <p className="text-muted-foreground">За вашим запитом нічого не знайдено.</p>
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/activities/create?name=${encodeURIComponent(itemSearch)}&returnTo=checkout`)}
                      >
                        Створити активність
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/products/create?name=${encodeURIComponent(itemSearch)}&returnTo=checkout`)}
                      >
                        Створити продукт
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {productResults.length > 0 && (
                      <div>
                        <div className="text-primary bg-surface-alt font-heading px-4 py-2 text-[11px] font-semibold uppercase tracking-[.16em]">Товари</div>
                        {productResults.map((product) => (
                          <button
                            key={product.productId}
                            className="w-full cursor-pointer border-b border-[rgba(201,158,58,.08)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent"
                            onClick={() => handleAddItem(product.productId, "product", productToGridItem(product))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="text-foreground/45 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-foreground/55 text-[12.5px]">
                                    {product.inventory === -1 ? (
                                      <span>Необмежено</span>
                                    ) : product.inventory === 0 ? (
                                      <span className="text-destructive">Немає в наявності</span>
                                    ) : (
                                      <span>На складі: {product.inventory} шт.</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <span className="text-accent-bright font-mono text-[14px]">{product.price} грн</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {activityResults.length > 0 && (
                      <div>
                        <div className="text-primary bg-surface-alt font-heading px-4 py-2 text-[11px] font-semibold uppercase tracking-[.16em]">Активності</div>
                        {activityResults.map((activity) => (
                          <button
                            key={activity.activityId}
                            className="w-full cursor-pointer border-b border-[rgba(201,158,58,.08)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent"
                            onClick={() => handleAddItem(activity.activityId, "activity", activityToGridItem(activity))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="text-foreground/45 h-4 w-4" />
                                <span className="font-medium">{activity.name}</span>
                              </div>
                              <span className="text-accent-bright font-mono text-[14px]">{activity.price} грн</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Recently used — cached locally, revalidated once per entity type. */}
          {recent.length > 0 && (
            <div className="flex flex-col gap-3">
              <Overline>Нещодавно продані</Overline>
              <ItemGrid
                items={recent}
                dense
                onPick={(item) => handleAddItem(item.id, item.type, item)}
              />
            </div>
          )}

          {/* Browse: type first, then that type's categories */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={browseType} onValueChange={handleBrowseTypeChange}>
              <SelectTrigger className="h-[38px] w-[168px] cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product" className="cursor-pointer">Товари</SelectItem>
                <SelectItem value="activity" className="cursor-pointer">Активності</SelectItem>
              </SelectContent>
            </Select>

            <span className="h-[26px] w-px bg-[rgba(201,158,58,.22)]" />

            {[{ categoryId: ALL_CATEGORIES, name: "Усі" } as Category, ...categories].map((category) => {
              const isActive = activeCategory === category.categoryId
              return (
                <button
                  key={category.categoryId}
                  type="button"
                  onClick={() => handleCategoryChange(category.categoryId)}
                  className={`font-heading cursor-pointer border px-3 py-[7px] text-[12.5px] uppercase tracking-[.1em] transition-colors ${isActive
                    ? "border-primary bg-accent text-accent-bright"
                    : "border-[rgba(237,230,216,.16)] text-foreground/60 hover:text-foreground"
                    }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>

          {/* Browse grid */}
          <div className="relative min-h-[200px]">
            {gridItems.length === 0 && !isGridLoading ? (
              <p className="text-muted-foreground py-10 text-center">
                {browseType === "product" ? "Немає товарів у цій категорії" : "Немає активностей у цій категорії"}
              </p>
            ) : (
              <ItemGrid items={gridItems} onPick={(item) => handleAddItem(item.id, item.type, item)} />
            )}
            {isGridLoading && (
              <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              </div>
            )}
          </div>

          {(hasNextPage || prevCursors.length > 0) && (
            <div className="text-foreground/55 flex items-center justify-end gap-3 text-[13px]">
              <span>
                Сторінка <span className="text-foreground/80 font-mono font-medium">{prevCursors.length + 1}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-[34px] cursor-pointer border-[rgba(237,230,216,.15)] px-0"
                disabled={prevCursors.length === 0 || isGridLoading}
                onClick={goToPrevPage}
                aria-label="Попередня сторінка"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-primary h-8 w-[34px] cursor-pointer border-[rgba(201,158,58,.5)] px-0"
                disabled={!hasNextPage || isGridLoading}
                onClick={goToNextPage}
                aria-label="Наступна сторінка"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <CartSection
          cartState={cartState}
          isCartUpdating={isCartUpdating}
          isCartLoading={isCartLoading}
          actions={actions}
          memberPanel={
            <MemberPanel
              member={attachedMember}
              onSelect={handleSelectMember}
              onRemove={handleRemoveMember}
              scanError={scanStatus === "error" ? scanError : undefined}
            />
          }
        />
      </div>

      <DonationDialog
        open={isDonationOpen}
        onOpenChange={setIsDonationOpen}
        hasMember={!!attachedMember}
        onSubmit={actions.addDonation}
      />
    </Layout>
  )
}
