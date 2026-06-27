import { useState } from 'react'
import { RotateCcw, Flag, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Card as CardType } from '../../types'
import type { ReviewRating } from '../../lib/spacedRepetition'

interface FlashCardProps {
  card: CardType
  flipped: boolean
  onFlip: () => void
  flagged: boolean
  onToggleFlag: () => void
}

export function FlashCard({
  card,
  flipped,
  onFlip,
  flagged,
  onToggleFlag,
}: FlashCardProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleFlag}
        className={`absolute -top-3 -right-3 z-10 rounded-full p-2 shadow-sm border transition-colors ${
          flagged
            ? 'bg-red-50 border-red-200 text-red-500'
            : 'bg-white border-zinc-200 text-zinc-400 hover:text-red-400'
        }`}
        aria-label={flagged ? 'Remove revisit flag' : 'Flag to revisit'}
      >
        <Flag className="h-4 w-4" fill={flagged ? 'currentColor' : 'none'} />
      </button>

      <div
        className="card-flip w-full cursor-pointer"
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onFlip()
          }
        }}
        aria-label="Flip card"
      >
        <div
          className={`card-flip-inner relative min-h-[320px] ${flipped ? 'flipped' : ''}`}
        >
          <div className="card-face absolute inset-0 flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 shadow-md">
            <Badge variant="topic">{card.topic}</Badge>
            <p className="mt-4 flex-1 text-lg leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {card.front}
            </p>
            <p className="mt-4 text-xs text-zinc-400">Tap to reveal answer</p>
          </div>
          <div className="card-face card-face-back absolute inset-0 flex flex-col rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8 shadow-md">
            <Badge variant="topic">{card.topic}</Badge>
            <p className="mt-4 flex-1 text-lg leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {card.back}
            </p>
            <p className="mt-4 text-xs text-indigo-400">Tap to flip back</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StudyViewProps {
  cards: CardType[]
  deckTitle: string
  onRate: (cardId: string, rating: ReviewRating) => void
  onToggleFlag: (cardId: string) => void
  onExit: () => void
}

export function StudyView({
  cards,
  deckTitle,
  onRate,
  onToggleFlag,
  onExit,
}: StudyViewProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-emerald-50 p-4 mb-4">
          <RotateCcw className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-medium text-zinc-900">All caught up!</h2>
        <p className="mt-1 text-sm text-zinc-500">No cards due for review right now.</p>
        <Button className="mt-6" variant="secondary" onClick={onExit}>
          Back to Library
        </Button>
      </div>
    )
  }

  const card = cards[index]
  const progress = ((index + 1) / cards.length) * 100

  const handleRate = (rating: ReviewRating) => {
    onRate(card.id, rating)
    setFlipped(false)
    if (index < cards.length - 1) {
      setIndex(index + 1)
    } else {
      onExit()
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{deckTitle}</h1>
          <p className="text-sm text-zinc-500">
            Card {index + 1} of {cards.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <FlashCard
        card={card}
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
        flagged={card.flagged}
        onToggleFlag={() => onToggleFlag(card.id)}
      />

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button variant="danger" onClick={() => handleRate('again')}>
            Again
          </Button>
          <Button variant="secondary" onClick={() => handleRate('hard')}>
            Hard
          </Button>
          <Button onClick={() => handleRate('good')}>Good</Button>
          <Button variant="success" onClick={() => handleRate('easy')}>
            Easy
          </Button>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1)
              setFlipped(false)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index >= cards.length - 1}
            onClick={() => {
              setIndex(index + 1)
              setFlipped(false)
            }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
