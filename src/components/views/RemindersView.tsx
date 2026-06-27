import { Bell, Flag, Play } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatNextReview, getDueCards, getRevisitCards, statusLabel } from '../../lib/spacedRepetition'
import type { Card as CardType } from '../../types'

interface RemindersViewProps {
  cards: CardType[]
  deckTitle: string
  onStudy: () => void
  onExit: () => void
}

export function RemindersView({
  cards,
  deckTitle,
  onStudy,
  onExit,
}: RemindersViewProps) {
  const due = getDueCards(cards)
  const revisit = getRevisitCards(cards)
  const upcoming = cards
    .filter((c) => c.nextReview && new Date(c.nextReview) > new Date() && !c.flagged)
    .sort(
      (a, b) =>
        new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime()
    )
    .slice(0, 10)

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
          <p className="text-2xl font-bold text-zinc-700">{upcoming.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Upcoming</p>
        </Card>
      </div>

      {due.length > 0 && (
        <Button className="w-full" size="lg" onClick={onStudy}>
          <Play className="h-4 w-4" />
          Study {due.length} Due Cards
        </Button>
      )}

      {revisit.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flag className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Flagged to Revisit</h2>
          </div>
          <div className="space-y-2">
            {revisit.map((card) => (
              <Card key={card.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant="topic">{card.topic}</Badge>
                    <p className="mt-1.5 text-sm font-medium text-zinc-800 truncate">
                      {card.front}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{card.back}</p>
                  </div>
                  <Badge variant="flagged">Revisit</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {due.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Due for Review</h2>
          </div>
          <div className="space-y-2">
            {due.slice(0, 8).map((card) => (
              <Card key={card.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant="topic">{card.topic}</Badge>
                    <p className="mt-1.5 text-sm font-medium text-zinc-800 truncate">
                      {card.front}
                    </p>
                  </div>
                  <Badge variant="due">{statusLabel(card.status)}</Badge>
                </div>
              </Card>
            ))}
            {due.length > 8 && (
              <p className="text-xs text-zinc-400 text-center">
                +{due.length - 8} more due cards
              </p>
            )}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Coming Up</h2>
          <div className="space-y-2">
            {upcoming.map((card) => (
              <Card key={card.id} padding="sm" className="opacity-80">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-700 truncate">{card.front}</p>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {formatNextReview(card.nextReview)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {due.length === 0 && revisit.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full bg-emerald-50 p-4 inline-flex mb-4">
            <Bell className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-medium text-zinc-900">You're all set!</h2>
          <p className="mt-1 text-sm text-zinc-500">No reminders right now.</p>
        </div>
      )}
    </div>
  )
}
