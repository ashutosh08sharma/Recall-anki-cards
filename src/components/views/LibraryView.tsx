import { BookOpen, Trash2, Play, HelpCircle, Bell, Pencil } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { getDueCards, getRevisitCards } from '../../lib/spacedRepetition'
import type { Deck } from '../../types'

interface LibraryViewProps {
  decks: Deck[]
  onStudy: (deckId: string) => void
  onQuiz: (deckId: string) => void
  onReminders: (deckId: string) => void
  onEdit: (deckId: string) => void
  onDelete: (deckId: string) => void
}

export function LibraryView({
  decks,
  onStudy,
  onQuiz,
  onReminders,
  onEdit,
  onDelete,
}: LibraryViewProps) {
  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-indigo-50 p-4 mb-4">
          <BookOpen className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-medium text-zinc-900">No decks yet</h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm">
          Import your notes to create your first flashcard deck. We'll parse topics
          and questions automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Your Decks
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {decks.length} deck{decks.length !== 1 ? 's' : ''} ·{' '}
          {decks.reduce((s, d) => s + d.cards.length, 0)} total cards
        </p>
      </div>

      <div className="space-y-4">
        {decks.map((deck) => {
          const due = getDueCards(deck.cards).length
          const revisit = getRevisitCards(deck.cards).length
          const topics = [...new Set(deck.cards.map((c) => c.topic))]

          return (
            <Card key={deck.id} className="group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-zinc-900 truncate">
                    {deck.title}
                  </h3>
                  {deck.description && (
                    <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{deck.cards.length} cards</Badge>
                    {due > 0 && <Badge variant="due">{due} due</Badge>}
                    {revisit > 0 && <Badge variant="flagged">{revisit} to revisit</Badge>}
                    {topics.slice(0, 4).map((t) => (
                      <Badge key={t} variant="topic">
                        {t}
                      </Badge>
                    ))}
                    {topics.length > 4 && (
                      <Badge variant="default">+{topics.length - 4}</Badge>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(deck.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Delete deck"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onStudy(deck.id)}>
                  <Play className="h-3.5 w-3.5" />
                  Study
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onQuiz(deck.id)}>
                  <HelpCircle className="h-3.5 w-3.5" />
                  Quiz
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onEdit(deck.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onReminders(deck.id)}
                >
                  <Bell className="h-3.5 w-3.5" />
                  Reminders
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
