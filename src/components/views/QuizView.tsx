import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Trophy } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Card as CardType } from '../../types'

interface QuizViewProps {
  cards: CardType[]
  deckTitle: string
  onExit: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function QuizView({ cards, deckTitle, onExit }: QuizViewProps) {
  const quizCards = useMemo(() => shuffle(cards).slice(0, Math.min(10, cards.length)), [cards])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = quizCards[index]

  const options = useMemo(() => {
    if (!current) return []
    const wrong = cards
      .filter((c) => c.id !== current.id)
      .map((c) => c.back)
    const distractors = shuffle(wrong).slice(0, 3)
    return shuffle([current.back, ...distractors])
  }, [current, cards])

  if (quizCards.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-zinc-500">Need at least 1 card to quiz.</p>
        <Button className="mt-4" variant="secondary" onClick={onExit}>
          Back
        </Button>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / quizCards.length) * 100)
    return (
      <div className="mx-auto max-w-md text-center py-16">
        <div className="rounded-full bg-indigo-50 p-4 inline-flex mb-4">
          <Trophy className="h-8 w-8 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-semibold text-zinc-900">Quiz Complete!</h2>
        <p className="mt-2 text-4xl font-bold text-indigo-600">{pct}%</p>
        <p className="text-sm text-zinc-500 mt-1">
          {score} of {quizCards.length} correct
        </p>
        <Button className="mt-8" onClick={onExit}>
          Back to Library
        </Button>
      </div>
    )
  }

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    if (option === current.back) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (index < quizCards.length - 1) {
      setIndex(index + 1)
      setSelected(null)
    } else {
      setFinished(true)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{deckTitle} — Quiz</h1>
          <p className="text-sm text-zinc-500">
            Question {index + 1} of {quizCards.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Badge variant="topic">{current.topic}</Badge>
        <p className="mt-4 text-lg font-medium text-zinc-900">{current.front}</p>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const isCorrect = option === current.back
          const isSelected = selected === option
          let style = 'border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
          if (selected) {
            if (isCorrect) style = 'border-emerald-300 bg-emerald-50'
            else if (isSelected) style = 'border-red-300 bg-red-50'
            else style = 'border-zinc-200 bg-zinc-50 opacity-60'
          }

          return (
            <button
              key={option}
              type="button"
              disabled={!!selected}
              onClick={() => handleSelect(option)}
              className={`w-full text-left rounded-xl border p-4 text-sm transition-all ${style}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-800">{option}</span>
                {selected && isCorrect && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                {selected && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <Button className="w-full" onClick={handleNext}>
          {index < quizCards.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
