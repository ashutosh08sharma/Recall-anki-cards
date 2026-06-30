import { Bell, Flag, Play } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { PaginatedReminderList } from '../PaginatedReminderList'
import {
  buildDeckReminders,
  buildUpcomingReminders,
  countActionableReminders,
  getUpcomingCards,
} from '../../lib/reminders'
import { getRevisitCards, getDueCards } from '../../lib/spacedRepetition'
import type { Card as CardType } from '../../types'

interface RemindersViewProps {
  deckId: string
  cards: CardType[]
  deckTitle: string
  onStudy: () => void
  onExit: () => void
  onClearReminder: (deckId: string, cardId: string) => void
  onClearReminders: (entries: { deckId: string; cardId: string }[]) => void
  onClearAllReminders: (deckId: string) => void
}

export function RemindersView({
  deckId,
  cards,
  deckTitle,
  onStudy,
  onExit,
  onClearReminder,
  onClearReminders,
  onClearAllReminders,
}: RemindersViewProps) {
  const actionable = buildDeckReminders(deckId, deckTitle, cards)
  const revisitItems = actionable.filter((item) => item.kind === 'revisit')
  const dueItems = actionable.filter((item) => item.kind === 'due')
  const upcoming = buildUpcomingReminders(deckId, deckTitle, cards)
  const due = getDueCards(cards)
  const revisit = getRevisitCards(cards)
  const upcomingTotal = getUpcomingCards(cards).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Reminders
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{deckTitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-amber-600">{due.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Due Now</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-red-500">{revisit.length}</p>
          <p className="text-xs text-zinc-500 mt-1">To Revisit</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-zinc-700">{upcomingTotal}</p>
          <p className="text-xs text-zinc-500 mt-1">Upcoming</p>
        </Card>
      </div>

      {actionable.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" size="lg" onClick={onStudy}>
            <Play className="h-4 w-4" />
            Study {countActionableReminders(cards)} Cards
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onClearAllReminders(deckId)}
          >
            Clear all
          </Button>
        </div>
      )}

      <PaginatedReminderList
        title="Flagged to Revisit"
        icon={<Flag className="h-4 w-4 text-red-500" />}
        items={revisitItems}
        onClear={onClearReminder}
        onClearAll={() =>
          onClearReminders(
            revisitItems.map((item) => ({ deckId: item.deckId, cardId: item.card.id }))
          )
        }
      />

      <PaginatedReminderList
        title="Due for Review"
        icon={<Bell className="h-4 w-4 text-amber-500" />}
        items={dueItems}
        onClear={onClearReminder}
        onClearAll={() =>
          onClearReminders(
            dueItems.map((item) => ({ deckId: item.deckId, cardId: item.card.id }))
          )
        }
      />

      <PaginatedReminderList
        title="Coming Up"
        items={upcoming}
        onClear={onClearReminder}
        showClearAll={false}
      />

      {actionable.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full bg-emerald-50 p-4 inline-flex mb-4">
            <Bell className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-medium text-zinc-900">You&apos;re all set!</h2>
          <p className="mt-1 text-sm text-zinc-500">No reminders right now.</p>
        </div>
      )}
    </div>
  )
}
