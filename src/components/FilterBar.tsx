import { Search, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import {
  hasActiveLibraryFilters,
  type LibraryFilters,
} from '../lib/libraryFilters'

interface FilterBarProps {
  filters: LibraryFilters
  topics: string[]
  filteredCount: number
  totalCount: number
  onChange: (filters: LibraryFilters) => void
  onClear: () => void
}

export function FilterBar({
  filters,
  topics,
  filteredCount,
  totalCount,
  onChange,
  onClear,
}: FilterBarProps) {
  const active = hasActiveLibraryFilters(filters)

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            placeholder="Search decks, descriptions, or cards…"
            aria-label="Search decks"
            className="search-input-custom-clear w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, q: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {topics.length > 0 && (
          <div className="sm:w-48">
            <label className="sr-only" htmlFor="library-topic-filter">
              Filter by topic
            </label>
            <select
              id="library-topic-filter"
              value={filters.topic ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  topic: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filters.due ? 'primary' : 'secondary'}
          onClick={() => onChange({ ...filters, due: !filters.due })}
          aria-pressed={filters.due}
        >
          Has due cards
        </Button>
        <Button
          size="sm"
          variant={filters.reminders ? 'primary' : 'secondary'}
          onClick={() => onChange({ ...filters, reminders: !filters.reminders })}
          aria-pressed={filters.reminders}
        >
          Has reminders
        </Button>

        {active && (
          <>
            <Button size="sm" variant="ghost" onClick={onClear}>
              Clear filters
            </Button>
            <Badge variant="default" className="ml-auto">
              {filteredCount} of {totalCount}
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}
