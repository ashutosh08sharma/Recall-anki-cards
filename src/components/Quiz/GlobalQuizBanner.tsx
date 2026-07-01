import { Shuffle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MIN_GLOBAL_QUIZ_POOL } from '../../lib/quiz'

interface GlobalQuizBannerProps {
  deckCount: number
  cardCount: number
  onStart: () => void
}

export function GlobalQuizBanner({ deckCount, cardCount, onStart }: GlobalQuizBannerProps) {
  const canStart = cardCount >= MIN_GLOBAL_QUIZ_POOL

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
            <Shuffle className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Mix Quiz</h2>
            <p className="mt-0.5 text-sm text-zinc-600">
              {canStart
                ? `Random questions pulled from all ${deckCount} decks — keep yourself on your toes.`
                : `Add at least ${MIN_GLOBAL_QUIZ_POOL} cards across your decks to unlock mix quiz.`}
            </p>
          </div>
        </div>
        <Button
          className="shrink-0 sm:self-center"
          disabled={!canStart}
          onClick={onStart}
          aria-disabled={!canStart}
        >
          <Shuffle className="h-4 w-4" />
          Start mix quiz
        </Button>
      </div>
    </Card>
  )
}
