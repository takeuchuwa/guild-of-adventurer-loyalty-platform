"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Filter, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchCategoriesByKind } from "@/components/categories/api/category-api"
import type { Category } from "@/components/categories/types/category-types"

interface CategoryFilterProps {
    kind: "PRODUCT" | "ACTIVITY"
    selectedCategoryId: string | undefined
    onChange: (categoryId: string | undefined) => void
}

export function CategoryFilter({ kind, selectedCategoryId, onChange }: CategoryFilterProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    useEffect(() => {
        if (open && !hasLoaded) {
            const loadCategories = async () => {
                setIsLoading(true)
                try {
                    const data = await fetchCategoriesByKind(kind)
                    setCategories(data.categories || [])
                    setHasLoaded(true)
                } catch (error) {
                    console.error("Error loading filter categories:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            loadCategories()
        }
    }, [open, hasLoaded, kind])

    const selectedCategory = categories.find((c) => c.categoryId === selectedCategoryId)

    const handleSelect = (categoryId: string) => {
        if (!categoryId) {
            onChange(undefined)
        } else {
            onChange(categoryId)
        }
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 px-3 border-dashed flex items-center gap-1 cursor-pointer",
                        selectedCategoryId && "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    <span>Категорія: {selectedCategory ? selectedCategory.name : "Усі"}</span>
                    {selectedCategoryId ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(undefined)
                            }}
                            className="ml-1 p-0.5 hover:bg-accent cursor-pointer"
                            title="Очистити фільтр"
                        >
                            <X className="h-3 w-3" />
                        </span>
                    ) : (
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="start">
                {isLoading ? (
                    <div className="p-3 text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Завантаження...</span>
                    </div>
                ) : (
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                        <button
                            onClick={() => handleSelect("")}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer text-left"
                        >
                            <span>Усі категорії</span>
                            {!selectedCategoryId && <Check className="h-4 w-4" />}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.categoryId}
                                onClick={() => handleSelect(category.categoryId)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-accent text-left cursor-pointer"
                            >
                                <span>{category.name}</span>
                                {selectedCategoryId === category.categoryId && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
