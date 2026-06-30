import type { Card, CardStatus } from '../types'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function createDefaultCard(
  front: string,
  back: string,
  topic: string,
  id: string
): Card {
  return {
    id,
    front,
    back,
    topic,
    status: 'new',
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: null,
    lastReviewed: null,
    flagged: false,
    createdAt: new Date().toISOString(),
  }
}

export function rateCard(card: Card, rating: ReviewRating): Card {
  const now = new Date()
  const updated = { ...card, lastReviewed: now.toISOString() }

  switch (rating) {
    case 'again':
      return {
        ...updated,
        status: 'revisit',
        ease: Math.max(1.3, card.ease - 0.2),
        interval: 0,
        repetitions: 0,
        nextReview: addDays(now, 0),
        flagged: true,
      }
    case 'hard':
      return {
        ...updated,
        status: 'learning',
        ease: Math.max(1.3, card.ease - 0.15),
        interval: Math.max(1, Math.round(card.interval * 1.2) || 1),
        repetitions: card.repetitions + 1,
        nextReview: addDays(now, Math.max(1, Math.round(card.interval * 1.2) || 1)),
      }
    case 'good':
      return {
        ...updated,
        status: 'review',
        interval: card.repetitions === 0 ? 1 : Math.round(card.interval * card.ease) || 1,
        repetitions: card.repetitions + 1,
        nextReview: addDays(
          now,
          card.repetitions === 0 ? 1 : Math.round(card.interval * card.ease) || 1
        ),
        flagged: false,
      }
    case 'easy':
      return {
        ...updated,
        status: 'review',
        ease: card.ease + 0.15,
        interval: Math.round((card.interval || 1) * card.ease * 1.3) || 2,
        repetitions: card.repetitions + 1,
        nextReview: addDays(
          now,
          Math.round((card.interval || 1) * card.ease * 1.3) || 2
        ),
        flagged: false,
      }
  }
}

export function isDue(card: Card): boolean {
  if (card.status === 'new') return true
  if (!card.nextReview) return true
  return new Date(card.nextReview) <= new Date()
}

export function getDueCards(cards: Card[]): Card[] {
  return cards.filter(isDue).sort((a, b) => {
    if (a.flagged && !b.flagged) return -1
    if (!a.flagged && b.flagged) return 1
    const aDate = a.nextReview ? new Date(a.nextReview).getTime() : 0
    const bDate = b.nextReview ? new Date(b.nextReview).getTime() : 0
    return aDate - bDate
  })
}

export function getRevisitCards(cards: Card[]): Card[] {
  return cards.filter((c) => c.flagged || c.status === 'revisit')
}

export function isActionableReminder(card: Card): boolean {
  return card.flagged || card.status === 'revisit' || isDue(card)
}

/** Dismiss a reminder by unflagging and snoozing until tomorrow. */
export function clearReminder(card: Card): Card {
  const now = new Date()
  return {
    ...card,
    flagged: false,
    status:
      card.status === 'revisit' || card.status === 'new' ? 'review' : card.status,
    interval: Math.max(card.interval, 1),
    nextReview: addDays(now, 1),
  }
}

export function statusLabel(status: CardStatus): string {
  const labels: Record<CardStatus, string> = {
    new: 'New',
    learning: 'Learning',
    review: 'Review',
    revisit: 'Revisit',
  }
  return labels[status]
}

export function formatNextReview(iso: string | null): string {
  if (!iso) return 'Not scheduled'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Due now'
  const days = Math.ceil(diff / DAY_MS)
  if (days === 0) return 'Due today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}
