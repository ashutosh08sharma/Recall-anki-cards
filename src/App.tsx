import { useEffect, useMemo, useState } from 'react'
import type { AppView, Deck, ParseResult } from './types'
import { useDecks } from './hooks/useDecks'
import { getDueCards, getRevisitCards } from './lib/spacedRepetition'
import { countActionableReminders, buildGlobalReminders, buildGlobalUpcoming } from './lib/reminders'
import { PaginatedReminderList } from './components/PaginatedReminderList'
import {
  clearShareFromLocation,
  decodeSharePayload,
  readShareFromLocation,
} from './lib/export'
import { Layout } from './components/Layout'
import { ImportView } from './components/views/ImportView'
import { LibraryView } from './components/views/LibraryView'
import { StudyView } from './components/views/StudyView'
import { QuizView } from './components/views/QuizView'
import { EditDeckView } from './components/views/EditDeckView'
import { RemindersView } from './components/views/RemindersView'
import { ShareDeckDialog } from './components/ShareDeckDialog'
import { Bell } from 'lucide-react'
import type { ReminderItem } from './lib/reminders'
import { Button } from './components/ui/Button'
import { ImportShareDialog } from './components/ImportExportPanel'
import { hasLibraryFilterParams } from './lib/libraryFilters'

function App() {
  const { decks, isLoading, createDeck, importDecks, deleteDeck, updateDeck, addCard, removeCard, updateCardFields, rateDeckCard, toggleFlag, clearCardReminder, clearReminderEntries, clearAllReminders, getDeck } =
    useDecks()

  const [view, setView] = useState<AppView>(() =>
    hasLibraryFilterParams(window.location.search) ? 'library' : 'import'
  )
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [shareDecks, setShareDecks] = useState<Deck[] | null>(null)
  const [pendingImport, setPendingImport] = useState<Deck[] | null>(null)
  const [studySessionKey, setStudySessionKey] = useState(0)
  const [quizSessionKey, setQuizSessionKey] = useState(0)

  useEffect(() => {
    const payload = readShareFromLocation()
    if (!payload) return

    clearShareFromLocation()
    decodeSharePayload(payload)
      .then((imported) => {
        if (imported.length > 0) setPendingImport(imported)
      })
      .catch(() => {
        /* invalid share link — ignore silently */
      })
  }, [])

  const activeDeck = activeDeckId ? getDeck(activeDeckId) : undefined

  const { reminderCount, dueCount, revisitCount } = useMemo(() => {
    const allCards = decks.flatMap((d) => d.cards)
    return {
      reminderCount: countActionableReminders(allCards),
      dueCount: getDueCards(allCards).length,
      revisitCount: getRevisitCards(allCards).length,
    }
  }, [decks])

  const globalReminders = useMemo(() => buildGlobalReminders(decks), [decks])
  const globalUpcoming = useMemo(() => buildGlobalUpcoming(decks), [decks])

  const handleCreateDeck = (title: string, description: string, result: ParseResult) => {
    createDeck(title, description, result.topics)
    setView('library')
  }

  const handleImportDecks = (incoming: Deck[]) => {
    importDecks(incoming)
    setView('library')
  }

  const handleConfirmShareImport = () => {
    if (pendingImport) {
      importDecks(pendingImport)
      setPendingImport(null)
      setView('library')
    }
  }

  const openDeck = (deckId: string) => {
    setActiveDeckId(deckId)
  }

  const handleStudy = (deckId: string) => {
    openDeck(deckId)
    setStudySessionKey((k) => k + 1)
    setView('study')
  }

  const handleQuiz = (deckId: string) => {
    openDeck(deckId)
    setQuizSessionKey((k) => k + 1)
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
    <>
    <Layout
      view={view}
      onNavigate={setView}
      dueCount={reminderCount}
    >
      {view === 'import' && (
        <ImportView onCreateDeck={handleCreateDeck} onImportDecks={handleImportDecks} />
      )}

      {view === 'library' && (
        <LibraryView
          decks={decks}
          onStudy={handleStudy}
          onQuiz={handleQuiz}
          onReminders={handleReminders}
          onEdit={handleEdit}
          onDelete={deleteDeck}
          onShare={setShareDecks}
          onCreateDeck={() => setView('import')}
          onExportAll={() => {
            if (decks.length === 0) return
            setShareDecks(decks)
          }}
        />
      )}

      {view === 'study' && activeDeck && (
        <StudyView
          key={studySessionKey}
          cards={studyCards.length > 0 ? studyCards : activeDeck.cards}
          deckTitle={activeDeck.title}
          onRate={(cardId, rating) => rateDeckCard(activeDeck.id, cardId, rating)}
          onToggleFlag={(cardId) => toggleFlag(activeDeck.id, cardId)}
          onExit={exitDeckView}
        />
      )}

      {view === 'quiz' && activeDeck && (
        <QuizView
          key={quizSessionKey}
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
        <GlobalRemindersView
          reminderCount={reminderCount}
          dueCount={dueCount}
          revisitCount={revisitCount}
          reminders={globalReminders}
          upcoming={globalUpcoming}
          onStudyDeck={handleStudy}
          onClearReminder={clearCardReminder}
          onClearReminders={clearReminderEntries}
          onClearAll={() => clearAllReminders()}
        />
      )}

      {view === 'reminders' && activeDeck && (
        <RemindersView
          deckId={activeDeck.id}
          cards={activeDeck.cards}
          deckTitle={activeDeck.title}
          onStudy={() => handleStudy(activeDeck.id)}
          onExit={exitDeckView}
          onClearReminder={clearCardReminder}
          onClearReminders={clearReminderEntries}
          onClearAllReminders={clearAllReminders}
        />
      )}
    </Layout>

    {shareDecks && (
      <ShareDeckDialog decks={shareDecks} onClose={() => setShareDecks(null)} />
    )}

    {pendingImport && (
      <ImportShareDialog
        decks={pendingImport}
        onImport={handleConfirmShareImport}
        onDismiss={() => setPendingImport(null)}
      />
    )}
  </>
  )
}

function GlobalRemindersView({
  reminderCount,
  dueCount,
  revisitCount,
  reminders,
  upcoming,
  onStudyDeck,
  onClearReminder,
  onClearReminders,
  onClearAll,
}: {
  reminderCount: number
  dueCount: number
  revisitCount: number
  reminders: ReminderItem[]
  upcoming: ReminderItem[]
  onStudyDeck: (deckId: string) => void
  onClearReminder: (deckId: string, cardId: string) => void
  onClearReminders: (entries: { deckId: string; cardId: string }[]) => void
  onClearAll: () => void
}) {
  const revisitItems = reminders.filter((item) => item.kind === 'revisit')
  const dueItems = reminders.filter((item) => item.kind === 'due')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            All Reminders
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {reminderCount} active · {dueCount} due · {revisitCount} to revisit
          </p>
        </div>
        {reminderCount > 0 && (
          <Button variant="secondary" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <PaginatedReminderList
        title="Flagged to Revisit"
        items={revisitItems}
        showDeckTitle
        onClear={onClearReminder}
        onClearAll={() =>
          onClearReminders(
            revisitItems.map((item) => ({ deckId: item.deckId, cardId: item.card.id }))
          )
        }
        onItemClick={(item) => onStudyDeck(item.deckId)}
      />

      <PaginatedReminderList
        title="Due for Review"
        items={dueItems}
        showDeckTitle
        onClear={onClearReminder}
        onClearAll={() =>
          onClearReminders(
            dueItems.map((item) => ({ deckId: item.deckId, cardId: item.card.id }))
          )
        }
        onItemClick={(item) => onStudyDeck(item.deckId)}
      />

      <PaginatedReminderList
        title="Coming Up"
        items={upcoming}
        showDeckTitle
        onClear={onClearReminder}
        showClearAll={false}
      />

      {reminderCount === 0 && upcoming.length === 0 && (
        <div className="text-center py-16">
          <div className="rounded-full bg-emerald-50 p-4 inline-flex mb-4">
            <Bell className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-medium text-zinc-900">All caught up!</p>
          <p className="text-sm text-zinc-500 mt-1">No cards need your attention.</p>
        </div>
      )}
    </div>
  )
}

export default App
