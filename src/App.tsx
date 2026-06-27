import { useMemo, useState } from 'react'
import type { AppView, ParseResult } from './types'
import { useDecks } from './hooks/useDecks'
import { getDueCards, getRevisitCards } from './lib/spacedRepetition'
import { Layout } from './components/Layout'
import { ImportView } from './components/views/ImportView'
import { LibraryView } from './components/views/LibraryView'
import { StudyView } from './components/views/StudyView'
import { QuizView } from './components/views/QuizView'
import { EditDeckView } from './components/views/EditDeckView'
import { RemindersView } from './components/views/RemindersView'

function App() {
  const { decks, isLoading, createDeck, deleteDeck, updateDeck, addCard, removeCard, updateCardFields, rateDeckCard, toggleFlag, getDeck } =
    useDecks()

  const [view, setView] = useState<AppView>('import')
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)

  const activeDeck = activeDeckId ? getDeck(activeDeckId) : undefined

  const { dueCount, revisitCount } = useMemo(() => {
    const allCards = decks.flatMap((d) => d.cards)
    return {
      dueCount: getDueCards(allCards).length,
      revisitCount: getRevisitCards(allCards).length,
    }
  }, [decks])

  const handleCreateDeck = (title: string, description: string, result: ParseResult) => {
    createDeck(title, description, result.topics)
    setView('library')
  }

  const openDeck = (deckId: string) => {
    setActiveDeckId(deckId)
  }

  const handleStudy = (deckId: string) => {
    openDeck(deckId)
    setView('study')
  }

  const handleQuiz = (deckId: string) => {
    openDeck(deckId)
    setView('quiz')
  }

  const handleReminders = (deckId: string) => {
    openDeck(deckId)
    setView('reminders')
  }

  const handleEdit = (deckId: string) => {
    openDeck(deckId)
    setView('edit')
  }

  const exitDeckView = () => {
    setActiveDeckId(null)
    setView('library')
  }

  const studyCards = activeDeck ? getDueCards(activeDeck.cards) : []

  const allDueCards = useMemo(
    () => decks.flatMap((d) => getDueCards(d.cards).map((c) => ({ ...c, deckId: d.id, deckTitle: d.title }))),
    [decks]
  )

  const allRevisitCards = useMemo(
    () => decks.flatMap((d) => getRevisitCards(d.cards).map((c) => ({ ...c, deckId: d.id, deckTitle: d.title }))),
    [decks]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-zinc-500">Loading your decks…</p>
        </div>
      </div>
    )
  }

  return (
    <Layout
      view={view}
      onNavigate={setView}
      dueCount={dueCount}
      revisitCount={revisitCount}
    >
      {view === 'import' && <ImportView onCreateDeck={handleCreateDeck} />}

      {view === 'library' && (
        <LibraryView
          decks={decks}
          onStudy={handleStudy}
          onQuiz={handleQuiz}
          onReminders={handleReminders}
          onEdit={handleEdit}
          onDelete={deleteDeck}
        />
      )}

      {view === 'study' && activeDeck && (
        <StudyView
          cards={studyCards.length > 0 ? studyCards : activeDeck.cards}
          deckTitle={activeDeck.title}
          onRate={(cardId, rating) => rateDeckCard(activeDeck.id, cardId, rating)}
          onToggleFlag={(cardId) => toggleFlag(activeDeck.id, cardId)}
          onExit={exitDeckView}
        />
      )}

      {view === 'quiz' && activeDeck && (
        <QuizView
          cards={activeDeck.cards}
          deckTitle={activeDeck.title}
          onExit={exitDeckView}
        />
      )}

      {view === 'edit' && activeDeck && (
        <EditDeckView
          deck={activeDeck}
          onUpdateDeck={(updates) => updateDeck(activeDeck.id, updates)}
          onUpdateCard={(cardId, fields) =>
            updateCardFields(activeDeck.id, cardId, fields)
          }
          onAddCard={(front, back, topic) =>
            addCard(activeDeck.id, front, back, topic)
          }
          onRemoveCard={(cardId) => removeCard(activeDeck.id, cardId)}
          onExit={exitDeckView}
        />
      )}

      {view === 'reminders' && !activeDeck && (
        <GlobalReminders
          dueCount={dueCount}
          revisitCount={revisitCount}
          allDue={allDueCards}
          allRevisit={allRevisitCards}
          onStudyDeck={handleStudy}
        />
      )}

      {view === 'reminders' && activeDeck && (
        <RemindersView
          cards={activeDeck.cards}
          deckTitle={activeDeck.title}
          onStudy={() => handleStudy(activeDeck.id)}
          onExit={exitDeckView}
        />
      )}
    </Layout>
  )
}

function GlobalReminders({
  dueCount,
  revisitCount,
  allDue,
  allRevisit,
  onStudyDeck,
}: {
  dueCount: number
  revisitCount: number
  allDue: { deckId: string; deckTitle: string; front: string; id: string }[]
  allRevisit: { deckId: string; deckTitle: string; front: string; id: string }[]
  onStudyDeck: (deckId: string) => void
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          All Reminders
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {dueCount} due · {revisitCount} to revisit across all decks
        </p>
      </div>

      {allRevisit.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">Flagged to Revisit</h2>
          {allRevisit.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onStudyDeck(card.deckId)}
              className="w-full text-left rounded-xl border border-red-100 bg-red-50/50 p-4 hover:bg-red-50 transition-colors"
            >
              <p className="text-xs text-red-500 font-medium">{card.deckTitle}</p>
              <p className="text-sm text-zinc-800 mt-0.5">{card.front}</p>
            </button>
          ))}
        </section>
      )}

      {allDue.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">Due for Review</h2>
          {allDue.slice(0, 12).map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onStudyDeck(card.deckId)}
              className="w-full text-left rounded-xl border border-amber-100 bg-amber-50/50 p-4 hover:bg-amber-50 transition-colors"
            >
              <p className="text-xs text-amber-600 font-medium">{card.deckTitle}</p>
              <p className="text-sm text-zinc-800 mt-0.5">{card.front}</p>
            </button>
          ))}
        </section>
      )}

      {allDue.length === 0 && allRevisit.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-zinc-900">All caught up!</p>
          <p className="text-sm text-zinc-500 mt-1">No cards need your attention.</p>
        </div>
      )}
    </div>
  )
}

export default App
