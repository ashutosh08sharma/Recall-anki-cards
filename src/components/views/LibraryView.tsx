import { useMemo } from 'react'
import { BookOpen, Trash2, Play, HelpCircle, Bell, Pencil, Share2, Download, PlusCircle } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { FilterBar } from '../FilterBar'
import { GlobalQuizBanner } from '../Quiz/GlobalQuizBanner'
import { getDueCards, getRevisitCards } from '../../lib/spacedRepetition'
import { collectDeckTopics, filterDecks } from '../../lib/libraryFilters'
import { countGlobalQuizPool } from '../../lib/quiz'
import { useLibraryFilters } from '../../hooks/useLibraryFilters'
import type { Deck } from '../../types'

interface LibraryViewProps {
  decks: Deck[]
  onStudy: (deckId: string) => void
  onQuiz: (deckId: string) => void
  onGlobalQuiz: () => void
  onReminders: (deckId: string) => void
  onEdit: (deckId: string) => void
  onDelete: (deckId: string) => void
  onShare: (decks: Deck[]) => void
  onExportAll: () => void
  onCreateDeck: () => void
}

export function LibraryView({
  decks,
  onStudy,
  onQuiz,
  onGlobalQuiz,
  onReminders,
  onEdit,
  onDelete,
  onShare,
  onExportAll,
  onCreateDeck,
}: LibraryViewProps) {
  const { filters, setFilters, clearFilters } = useLibraryFilters()
  const topics = useMemo(() => collectDeckTopics(decks), [decks])
  const filteredDecks = useMemo(
    () => filterDecks(decks, filters),
    [decks, filters]
  )

  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center" role="status">
        <div className="mb-4 rounded-full bg-indigo-50 p-4">
          <BookOpen className="h-8 w-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-medium text-zinc-900">No decks yet</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Generate flashcards with AI, paste your notes, or import a shared deck to get started.
        </p>
        <Button size="lg" className="mt-6" onClick={onCreateDeck}>
          <PlusCircle className="h-4 w-4" />
          Create your first deck
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Your Decks
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filteredDecks.length === decks.length
              ? `${decks.length} deck${decks.length !== 1 ? 's' : ''}`
              : `${filteredDecks.length} of ${decks.length} decks`}{' '}
            · {decks.reduce((s, d) => s + d.cards.length, 0)} total cards · newest first
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" onClick={onCreateDeck}>
            <PlusCircle className="h-3.5 w-3.5" />
            New Deck
          </Button>
          <Button size="sm" variant="secondary" onClick={onExportAll}>
            <Download className="h-3.5 w-3.5" />
            Export All
          </Button>
        </div>
      </div>

      <GlobalQuizBanner
        deckCount={decks.length}
        cardCount={countGlobalQuizPool(decks)}
        onStart={onGlobalQuiz}
      />

      <FilterBar
        filters={filters}
        topics={topics}
        filteredCount={filteredDecks.length}
        totalCount={decks.length}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {filteredDecks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-900">No decks match your filters</p>
          <p className="mt-1 text-sm text-zinc-500">
            Try adjusting your search or clearing filters.
          </p>
          <Button size="sm" variant="secondary" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDecks.map((deck) => {
            const due = getDueCards(deck.cards).length
            const revisit = getRevisitCards(deck.cards).length
            const deckTopics = [...new Set(deck.cards.map((c) => c.topic))]

            return (
              <Card key={deck.id} className="group">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-zinc-900">
                      {deck.title}
                    </h3>
                    {deck.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                        {deck.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{deck.cards.length} cards</Badge>
                      {due > 0 && <Badge variant="due">{due} due</Badge>}
                      {revisit > 0 && <Badge variant="flagged">{revisit} to revisit</Badge>}
                      {deckTopics.slice(0, 4).map((t) => (
                        <Badge key={t} variant="topic">
                          {t}
                        </Badge>
                      ))}
                      {deckTopics.length > 4 && (
                        <Badge variant="default">+{deckTopics.length - 4}</Badge>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(deck.id)}
                    className="rounded-lg p-2 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
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
                  <Button size="sm" variant="secondary" onClick={() => onShare([deck])}>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
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
      )}
    </div>
  )
}
