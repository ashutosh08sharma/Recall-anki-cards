import { useCallback, useMemo, useState } from 'react'
import { Sparkles, Layers, Wand2, FileUp } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { parseTextToTopics, parseStructuredInput } from '../../lib/parser'
import { ImportFromExport } from '../ImportExportPanel'
import { AIGeneratePanel } from '../AIGeneratePanel'
import { DeckPreview } from '../DeckPreview'
import type { Deck, ParseResult } from '../../types'

type CreateMode = 'ai' | 'smart' | 'structured'

interface ImportViewProps {
  onCreateDeck: (title: string, description: string, result: ParseResult) => void
  onImportDecks: (decks: Deck[]) => void
}

const modeTabs: { id: CreateMode; label: string; icon: typeof Sparkles }[] = [
  { id: 'ai', label: 'AI Generate', icon: Wand2 },
  { id: 'smart', label: 'Paste Notes', icon: Sparkles },
  { id: 'structured', label: 'Front / Back', icon: Layers },
]

export function ImportView({ onCreateDeck, onImportDecks }: ImportViewProps) {
  const [mode, setMode] = useState<CreateMode>('ai')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rawText, setRawText] = useState('')
  const [frontText, setFrontText] = useState('')
  const [backText, setBackText] = useState('')
  const [aiPreview, setAiPreview] = useState<ParseResult | null>(null)
  const [aiStreaming, setAiStreaming] = useState(false)

  const parsedPreview = useMemo<ParseResult>(() => {
    if (mode === 'smart') {
      return parseTextToTopics(rawText, title || undefined)
    }
    if (mode === 'structured') {
      return parseStructuredInput(title, frontText, backText)
    }
    return { topics: [], totalCards: 0 }
  }, [mode, rawText, title, frontText, backText])

  const preview = mode === 'ai' ? aiPreview ?? { topics: [], totalCards: 0 } : parsedPreview

  const handleAiPreviewChange = useCallback((next: ParseResult | null, streaming: boolean) => {
    setAiPreview(next)
    setAiStreaming(streaming)
  }, [])

  const handleModeChange = (next: CreateMode) => {
    setMode(next)
    if (next !== 'ai') {
      setAiPreview(null)
      setAiStreaming(false)
    }
  }

  const canCreate = preview.totalCards > 0 && title.trim().length > 0 && !aiStreaming

  const handleCreate = () => {
    if (!canCreate) return
    onCreateDeck(title.trim(), description.trim(), preview)
    setTitle('')
    setDescription('')
    setRawText('')
    setFrontText('')
    setBackText('')
    setAiPreview(null)
    setAiStreaming(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create a Deck
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate flashcards with AI, paste your notes, or import a shared deck.
        </p>
      </div>

      <ImportFromExport onImport={onImportDecks} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--color-surface)] px-3 text-zinc-400">
            or create a new deck
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {modeTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleModeChange(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === id
                ? id === 'ai'
                  ? 'bg-violet-600 text-white'
                  : 'bg-indigo-600 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <Card className="space-y-5">
        <Input
          label="Deck Title"
          placeholder={
            mode === 'ai'
              ? 'e.g. Data Structures (auto-filled from topic)'
              : 'e.g. Data Structures & Algorithms'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Description"
          placeholder="Optional — scope, exam prep, or extra context for AI"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {mode === 'ai' && (
          <AIGeneratePanel
            deckTitle={title}
            deckDescription={description}
            onDeckTitleChange={setTitle}
            onPreviewChange={handleAiPreviewChange}
          />
        )}

        {mode === 'smart' && (
          <TextArea
            label="Paste your notes"
            hint="Supports # topics, Q:/A:, Front:/Back:, term — definition, and numbered questions"
            placeholder={`# Data Structures

Q: What is a hash table?
A: A key-value store that maps keys to buckets using a hash function for O(1) average lookup.

# Big-O Notation
- O(1) — Constant time; runtime does not grow with input size
- O(n log n) — Typical time for efficient sorting algorithms like mergesort`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[280px] font-mono text-xs leading-relaxed"
          />
        )}

        {mode === 'structured' && (
          <>
            <TextArea
              label="Front (questions)"
              hint="Separate cards with blank lines or ---"
              placeholder="What is a closure in JavaScript?&#10;---&#10;Explain time complexity of binary search"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
            />
            <TextArea
              label="Back (answers)"
              hint="Answers in the same order as fronts"
              placeholder="A function that captures variables from its enclosing scope&#10;---&#10;O(log n) — halves the search space each step"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
            />
          </>
        )}
      </Card>

      {preview.totalCards > 0 && (
        <DeckPreview preview={preview} isStreaming={mode === 'ai' && aiStreaming} />
      )}

      <Button
        size="lg"
        className={`w-full ${mode === 'ai' ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
        disabled={!canCreate}
        onClick={handleCreate}
      >
        {mode === 'ai' ? (
          <Wand2 className="h-4 w-4" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        Create Deck ({preview.totalCards} cards)
      </Button>
    </div>
  )
}
