import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock, Timer, Trophy, XCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { Card as CardType } from '../../types'

interface QuizViewProps {
  cards: CardType[]
  deckTitle: string
  onExit: () => void
}

const TIMER_OPTIONS = [
  { label: 'No timer', value: 0 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
] as const

type QuizPhase = 'setup' | 'quiz' | 'finished'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function QuizView({ cards, deckTitle, onExit }: QuizViewProps) {
  const quizCards = useMemo(
    () => shuffle(cards).slice(0, Math.min(10, cards.length)),
    [cards]
  )

  const [phase, setPhase] = useState<QuizPhase>('setup')
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [timeoutCount, setTimeoutCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const advancingRef = useRef(false)

  const current = quizCards[index]
  const timed = secondsPerQuestion > 0

  const options = useMemo(() => {
    if (!current) return []
    const wrong = cards.filter((c) => c.id !== current.id).map((c) => c.back)
    const distractors = shuffle(wrong).slice(0, 3)
    return shuffle([current.back, ...distractors])
  }, [current, cards])

  const advance = useCallback(() => {
    if (advancingRef.current) return
    advancingRef.current = true

    if (index < quizCards.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
    } else {
      setPhase('finished')
    }

    setTimeout(() => {
      advancingRef.current = false
    }, 0)
  }, [index, quizCards.length])

  const handleTimeout = useCallback(() => {
    if (selected || advancingRef.current) return
    setTimeoutCount((c) => c + 1)
    setSelected('__timeout__')
  }, [selected])

  useEffect(() => {
    if (phase !== 'quiz' || !timed || selected) return

    setTimeLeft(secondsPerQuestion)
    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [phase, timed, secondsPerQuestion, index, selected, handleTimeout])

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

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {deckTitle} — Quiz
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {quizCards.length} questions · choose your mode
          </p>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-zinc-900">Time per question</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIMER_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSecondsPerQuestion(value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  secondsPerQuestion === value
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            size="lg"
            onClick={() => {
              setPhase('quiz')
              setTimeLeft(secondsPerQuestion)
            }}
          >
            {timed ? `Start timed quiz (${secondsPerQuestion}s)` : 'Start quiz'}
          </Button>
          <Button variant="secondary" size="lg" onClick={onExit}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'finished') {
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
        {timed && timeoutCount > 0 && (
          <p className="text-sm text-amber-600 mt-1">{timeoutCount} timed out</p>
        )}
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

  const timerPct = timed ? (timeLeft / secondsPerQuestion) * 100 : 100
  const timerUrgent = timed && timeLeft <= 5

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{deckTitle} — Quiz</h1>
          <p className="text-sm text-zinc-500">
            Question {index + 1} of {quizCards.length}
            {timed && (
              <span className={`ml-2 inline-flex items-center gap-1 ${timerUrgent ? 'text-red-500 font-medium' : ''}`}>
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}s
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      {timed && !selected && (
        <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              timerUrgent ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

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
          if (selected === '__timeout__') {
            if (isCorrect) style = 'border-emerald-300 bg-emerald-50'
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

      {selected === '__timeout__' && (
        <p className="text-sm text-center text-amber-600 font-medium">Time&apos;s up!</p>
      )}

      {selected && (
        <Button className="w-full" onClick={advance}>
          {index < quizCards.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
