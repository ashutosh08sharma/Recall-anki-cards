import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { QuizQuestion } from '../../lib/quiz'

interface QuizQuestionPanelProps {
  title: string
  question: QuizQuestion
  questionIndex: number
  questionTotal: number
  options: string[]
  selected: string | null
  timed: boolean
  timeLeft: number
  secondsPerQuestion: number
  showDeckSource: boolean
  onSelect: (option: string) => void
  onAdvance: () => void
  onExit: () => void
}

export function QuizQuestionPanel({
  title,
  question,
  questionIndex,
  questionTotal,
  options,
  selected,
  timed,
  timeLeft,
  secondsPerQuestion,
  showDeckSource,
  onSelect,
  onAdvance,
  onExit,
}: QuizQuestionPanelProps) {
  const timerPct = timed ? (timeLeft / secondsPerQuestion) * 100 : 100
  const timerUrgent = timed && timeLeft <= 5
  const isLast = questionIndex >= questionTotal - 1

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-500">
            Question {questionIndex + 1} of {questionTotal}
            {timed && (
              <span
                className={`ml-2 inline-flex items-center gap-1 ${timerUrgent ? 'font-medium text-red-500' : ''}`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span aria-live="polite">{timeLeft}s</span>
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      {timed && !selected && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={secondsPerQuestion}
          aria-label="Time remaining"
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              timerUrgent ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="topic">{question.topic}</Badge>
          {showDeckSource && (
            <Badge>{question.deckTitle}</Badge>
          )}
        </div>
        <p className="mt-4 text-lg font-medium text-zinc-900">{question.front}</p>
      </div>

      <div className="space-y-2" role="list" aria-label="Answer choices">
        {options.map((option) => {
          const isCorrect = option === question.back
          const isSelected = selected === option
          let style = 'border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'

          if (selected) {
            if (isCorrect) style = 'border-emerald-300 bg-emerald-50'
            else if (isSelected) style = 'border-red-300 bg-red-50'
            else style = 'border-zinc-200 bg-zinc-50 opacity-60'
          }
          if (selected === '__timeout__') {
            style = isCorrect
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-zinc-200 bg-zinc-50 opacity-60'
          }

          return (
            <button
              key={option}
              type="button"
              role="listitem"
              disabled={!!selected}
              onClick={() => onSelect(option)}
              className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${style}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-800">{option}</span>
                {selected && isCorrect && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                )}
                {selected && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected === '__timeout__' && (
        <p className="text-center text-sm font-medium text-amber-600">Time&apos;s up!</p>
      )}

      {selected && (
        <Button className="w-full" onClick={onAdvance}>
          {isLast ? 'See results' : 'Next question'}
        </Button>
      )}
    </div>
  )
}
