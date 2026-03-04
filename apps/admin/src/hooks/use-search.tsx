"use client"

import { useCallback, useState } from "react"

export interface UseSearchOptions {
  baseSearch?: string
  searchPlaceholder?: string
  searchMask?: string
  searchDefaultValue?: string
}

/**
 * Simplified search hook
 * - manages a single search string
 * - provides props for DataTable integration
 * - passes raw search value directly to backend as "q" parameter
 * - supports input masking for formatted inputs (e.g., phone numbers)
 */
export function useSearch(options: UseSearchOptions = {}) {
  const { baseSearch = "", searchPlaceholder = "Пошук...", searchMask, searchDefaultValue } = options

  const [currentSearch, setCurrentSearch] = useState<string>(baseSearch)

  const handleSimpleSearch = useCallback((query: string) => {
    setCurrentSearch(query.trim())
  }, [])

  const searchProps = {
    onSimpleSearch: handleSimpleSearch,
    searchPlaceholder,
    searchMask,
    searchDefaultValue,
  }

  return {
    currentSearch,
    setCurrentSearch,
    handleSimpleSearch,
    searchProps,
  }
}
