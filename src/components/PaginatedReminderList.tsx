import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { formatNextReview, statusLabel } from '../lib/spacedRepetition'
import { REMINDERS_PAGE_SIZE, type ReminderItem } from '../lib/reminders'

interface PaginatedReminderListProps {
  title: string
  icon?: React.ReactNode
  items: ReminderItem[]
  showDeckTitle?: boolean
  showClearAll?: boolean
  onClear: (deckId: string, cardId: string) => void
  onClearAll?: () => void
  onItemClick?: (item: ReminderItem) => void
  emptyMessage?: string
}

export function PaginatedReminderList({
  title,
  icon,
  items,
  showDeckTitle = false,
  showClearAll = true,
  onClear,
  onClearAll,
  onItemClick,
  emptyMessage,
}: PaginatedReminderListProps) {
  const [visibleCount, setVisibleCount] = useState(REMINDERS_PAGE_SIZE)

  useEffect(() => {
    setVisibleCount((prev) => {
      if (items.length === 0) return REMINDERS_PAGE_SIZE
      if (prev > items.length) return Math.max(REMINDERS_PAGE_SIZE, items.length)
      return prev
    })
  }, [items.length])

  if (items.length === 0) {
    if (!emptyMessage) return null
    return <p className="text-sm text-zinc-500 text-center py-4">{emptyMessage}</p>
  }

  const visible = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-sm font-semibold text-zinc-900 truncate">{title}</h2>
          <Badge>{items.length}</Badge>
        </div>
        {showClearAll && onClearAll && items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((item) => (
          <ReminderRow
            key={`${item.deckId}-${item.card.id}`}
            item={item}
            showDeckTitle={showDeckTitle}
            onClear={() => onClear(item.deckId, item.card.id)}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        ))}
      </div>

      {hasMore && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-3"
          onClick={() => setVisibleCount((c) => c + REMINDERS_PAGE_SIZE)}
        >
          Load more ({items.length - visibleCount} remaining)
        </Button>
      )}
    </section>
  )
}

interface ReminderRowProps {
  item: ReminderItem
  showDeckTitle: boolean
  onClear: () => void
  onClick?: () => void
}

function ReminderRow({ item, showDeckTitle, onClear, onClick }: ReminderRowProps) {
  const { card, kind, deckTitle } = item
  const isUpcoming = kind === 'upcoming'

  const borderClass =
    kind === 'revisit'
      ? 'border-red-100 bg-red-50/40'
      : kind === 'due'
        ? 'border-amber-100 bg-amber-50/40'
        : 'border-zinc-200 bg-white opacity-90'

  const content = (
    <>
      <div className="min-w-0 flex-1">
        {showDeckTitle && (
          <p
            className={`text-xs font-medium truncate ${
              kind === 'revisit' ? 'text-red-500' : kind === 'due' ? 'text-amber-600' : 'text-zinc-500'
            }`}
          >
            {deckTitle}
          </p>
        )}
        {!showDeckTitle && <Badge variant="topic">{card.topic}</Badge>}
        <p className={`text-sm font-medium text-zinc-800 truncate ${showDeckTitle ? 'mt-0.5' : 'mt-1.5'}`}>
          {card.front}
        </p>
        {kind === 'revisit' && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{card.back}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isUpcoming ? (
          <span className="text-xs text-zinc-400">{formatNextReview(card.nextReview)}</span>
        ) : (
          <Badge variant={kind === 'revisit' ? 'flagged' : 'due'}>
            {kind === 'revisit' ? 'Revisit' : statusLabel(card.status)}
          </Badge>
        )}
        {!isUpcoming && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Clear reminder"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-xl border p-4 transition-colors hover:opacity-90 ${borderClass}`}
      >
        <div className="flex items-start justify-between gap-3">{content}</div>
      </button>
    )
  }

  return (
    <Card padding="sm" className={borderClass}>
      <div className="flex items-start justify-between gap-3">{content}</div>
    </Card>
  )
}
