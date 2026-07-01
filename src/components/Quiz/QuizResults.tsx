import { Trophy } from 'lucide-react'
import { Button } from '../ui/Button'

interface QuizResultsProps {
  score: number
  total: number
  timed: boolean
  timeoutCount: number
  onExit: () => void
}

export function QuizResults({ score, total, timed, timeoutCount, onExit }: QuizResultsProps) {
  const pct = Math.round((score / total) * 100)

  return (
    <div className="mx-auto max-w-md py-16 text-center" role="status">
      <div className="mb-4 inline-flex rounded-full bg-indigo-50 p-4">
        <Trophy className="h-8 w-8 text-indigo-500" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900">Quiz complete</h2>
      <p className="mt-2 text-4xl font-bold text-indigo-600">{pct}%</p>
      <p className="mt-1 text-sm text-zinc-500">
        {score} of {total} correct
      </p>
      {timed && timeoutCount > 0 && (
        <p className="mt-1 text-sm text-amber-600">{timeoutCount} timed out</p>
      )}
      <Button className="mt-8" onClick={onExit}>
        Back to Library
      </Button>
    </div>
  )
}
