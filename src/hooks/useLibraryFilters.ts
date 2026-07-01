import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_LIBRARY_FILTERS,
  parseLibraryFiltersFromSearch,
  syncLibraryFiltersToUrl,
  type LibraryFilters,
} from '../lib/libraryFilters'

export function useLibraryFilters() {
  const [filters, setFiltersState] = useState<LibraryFilters>(() =>
    parseLibraryFiltersFromSearch(window.location.search)
  )

  useEffect(() => {
    const onPopState = () => {
      setFiltersState(parseLibraryFiltersFromSearch(window.location.search))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setFilters = useCallback(
    (next: LibraryFilters | ((prev: LibraryFilters) => LibraryFilters)) => {
      setFiltersState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        syncLibraryFiltersToUrl(resolved)
        return resolved
      })
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_LIBRARY_FILTERS)
  }, [setFilters])

  return { filters, setFilters, clearFilters }
}
