import { useMemo, useState } from 'react'
import { Sparkles, FileText, Layers } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Badge } from '../ui/Badge'
import { parseTextToTopics, parseStructuredInput } from '../../lib/parser'
import { ImportFromExport } from '../ImportExportPanel'
import type { Deck, ParseResult } from '../../types'

type ImportMode = 'smart' | 'structured'

interface ImportViewProps {
  onCreateDeck: (title: string, description: string, result: ParseResult) => void
  onImportDecks: (decks: Deck[]) => void
}

export function ImportView({ onCreateDeck, onImportDecks }: ImportViewProps) {
  const [mode, setMode] = useState<ImportMode>('smart')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rawText, setRawText] = useState('')
  const [frontText, setFrontText] = useState('')
  const [backText, setBackText] = useState('')

  const preview = useMemo<ParseResult>(() => {
    if (mode === 'smart') {
      return parseTextToTopics(rawText, title || undefined)
    }
    return parseStructuredInput(title, frontText, backText)
  }, [mode, rawText, title, frontText, backText])

  const canCreate = preview.totalCards > 0 && title.trim().length > 0

  const handleCreate = () => {
    if (!canCreate) return
    onCreateDeck(title.trim(), description.trim(), preview)
    setTitle('')
    setDescription('')
    setRawText('')
    setFrontText('')
    setBackText('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Import & Parse
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Paste notes to auto-parse, or import a shared deck from a link or file.
        </p>
      </div>

      <ImportFromExport
        onImport={(decks) => {
          onImportDecks(decks)
        }}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--color-surface)] px-3 text-zinc-400">or create from text</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('smart')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'smart'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Smart Parse
        </button>
        <button
          type="button"
          onClick={() => setMode('structured')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'structured'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          Front / Back
        </button>
      </div>

      <Card className="space-y-5">
        <Input
          label="Deck Title"
          placeholder="e.g. Biology Chapter 5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Description"
          placeholder="Optional — what this deck covers"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {mode === 'smart' ? (
          <TextArea
            label="Paste your notes"
            hint="Supports # topics, Q:/A:, Front:/Back:, term — definition, and numbered questions"
            placeholder={`# Cell Biology

Q: What is mitosis?
A: Cell division producing two identical daughter cells.

Q: What is meiosis?
A: Cell division producing four genetically different gametes.

# Genetics
- DNA — Deoxyribonucleic acid, the molecule of heredity
- Gene — A segment of DNA that codes for a protein`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[280px] font-mono text-xs leading-relaxed"
          />
        ) : (
          <>
            <TextArea
              label="Front (questions)"
              hint="Separate cards with blank lines or ---"
              placeholder="What is photosynthesis?&#10;---&#10;Define osmosis"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
            />
            <TextArea
              label="Back (answers)"
              hint="Answers in the same order as fronts"
              placeholder="Process plants use to convert light into energy&#10;---&#10;Movement of water across a membrane"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
            />
          </>
        )}
      </Card>

      {preview.totalCards > 0 && (
        <Card padding="sm" className="border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">
              Preview — {preview.totalCards} cards in {preview.topics.length}{' '}
              {preview.topics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {preview.topics.map((topic) => (
              <div key={topic.name}>
                <Badge variant="topic">{topic.name}</Badge>
                <ul className="mt-2 space-y-1.5">
                  {topic.cards.slice(0, 3).map((card, i) => (
                    <li
                      key={i}
                      className="text-xs text-zinc-600 pl-2 border-l-2 border-indigo-200"
                    >
                      <span className="font-medium text-zinc-800">{card.front}</span>
                      <span className="text-zinc-400"> → </span>
                      <span>{card.back.slice(0, 80)}{card.back.length > 80 ? '…' : ''}</span>
                    </li>
                  ))}
                  {topic.cards.length > 3 && (
                    <li className="text-xs text-zinc-400 pl-2">
                      +{topic.cards.length - 3} more cards
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!canCreate}
        onClick={handleCreate}
      >
        <Sparkles className="h-4 w-4" />
        Create Deck ({preview.totalCards} cards)
      </Button>
    </div>
  )
}
