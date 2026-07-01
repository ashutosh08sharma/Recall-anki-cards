import { useEffect, useMemo, useState } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { Loader2, Sparkles, Square, Wand2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import {
  AI_GENERATION_LIMITS,
  flashcardGenerationSchema,
  generationToParseResult,
} from '../lib/flashcardSchema'
import type { ParseResult } from '../types'

interface AIGeneratePanelProps {
  deckTitle: string
  deckDescription: string
  onDeckTitleChange: (value: string) => void
  onPreviewChange: (preview: ParseResult | null, isStreaming: boolean) => void
}

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner', hint: 'Foundational concepts' },
  { value: 'intermediate', label: 'Intermediate', hint: 'Balanced depth' },
  { value: 'advanced', label: 'Advanced', hint: 'Nuanced & challenging' },
] as const

export function AIGeneratePanel({
  deckTitle,
  deckDescription,
  onDeckTitleChange,
  onPreviewChange,
}: AIGeneratePanelProps) {
  const [topic, setTopic] = useState(deckTitle)
  const [cardCount, setCardCount] = useState(12)
  const [difficulty, setDifficulty] =
    useState<(typeof difficultyOptions)[number]['value']>('intermediate')

  const { object, submit, isLoading, error, stop, clear } = useObject({
    api: '/api/generate-flashcards',
    schema: flashcardGenerationSchema,
  })

  const preview = useMemo(() => generationToParseResult(object), [object])

  useEffect(() => {
    onPreviewChange(preview, isLoading)
  }, [preview, isLoading, onPreviewChange])

  const canGenerate = topic.trim().length > 0 && !isLoading

  const handleGenerate = () => {
    if (!canGenerate) return
    if (!deckTitle.trim()) {
      onDeckTitleChange(topic.trim())
    }
    submit({
      topic: topic.trim(),
      context: deckDescription.trim() || undefined,
      cardCount,
      difficulty,
    })
  }

  const handleReset = () => {
    stop()
    clear()
    onPreviewChange(null, false)
  }

  const statusMessage = isLoading
    ? preview
      ? `Building your deck — ${preview.totalCards} cards drafted…`
      : 'Gemini is researching your topic…'
    : preview
      ? 'Generation complete. Review the preview below, then create your deck.'
      : 'Describe any topic — AI will draft flashcards you can study right away.'

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/80 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">AI Flashcard Generator</h2>
            <p className="mt-0.5 text-sm text-zinc-600">{statusMessage}</p>
          </div>
        </div>
      </div>

      <Input
        label="Topic"
        placeholder="e.g. Recursion, TCP/IP networking, SQL joins"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        hint="What should the flashcards cover?"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Number of cards
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={AI_GENERATION_LIMITS.MIN_CARDS}
              max={AI_GENERATION_LIMITS.MAX_CARDS}
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-indigo-600"
              disabled={isLoading}
            />
            <span className="w-8 text-center text-sm font-semibold tabular-nums text-indigo-700">
              {cardCount}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Difficulty
          </label>
          <div className="flex gap-1.5">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.hint}
                disabled={isLoading}
                onClick={() => setDifficulty(option.value)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                  difficulty === option.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message.includes('503') || error.message.includes('not configured')
            ? 'AI is not configured yet. Add GOOGLE_GENERATIVE_AI_API_KEY in Vercel project settings.'
            : error.message || 'Something went wrong while generating cards.'}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          className="flex-1"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
        {isLoading && (
          <Button size="lg" variant="secondary" onClick={stop}>
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </Button>
        )}
        {!isLoading && preview && (
          <Button size="lg" variant="secondary" onClick={handleReset}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
