import { Timer } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { TIMER_OPTIONS } from '../../lib/quiz'

interface QuizSetupProps {
  title: string
  subtitle: string
  questionCount: number
  secondsPerQuestion: number
  onSecondsChange: (seconds: number) => void
  onStart: () => void
  onCancel: () => void
}

export function QuizSetup({
  title,
  subtitle,
  questionCount,
  secondsPerQuestion,
  onSecondsChange,
  onStart,
  onCancel,
}: QuizSetupProps) {
  const timed = secondsPerQuestion > 0

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {questionCount} questions · {subtitle}
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-900">Time per question</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Time per question">
          {TIMER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              aria-pressed={secondsPerQuestion === value}
              onClick={() => onSecondsChange(value)}
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
        <Button className="flex-1" size="lg" onClick={onStart}>
          {timed ? `Start timed quiz (${secondsPerQuestion}s)` : 'Start quiz'}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
