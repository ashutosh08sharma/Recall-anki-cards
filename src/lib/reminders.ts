import type { Card } from '../types'
import { getDueCards, getRevisitCards } from './spacedRepetition'

export const REMINDERS_PAGE_SIZE = 10

export type ReminderKind = 'revisit' | 'due' | 'upcoming'

export interface ReminderItem {
  card: Card
  deckId: string
  deckTitle: string
  kind: ReminderKind
}

export function getActionableReminders(cards: Card[]): Card[] {
  const revisit = getRevisitCards(cards)
  const due = getDueCards(cards)
  const seen = new Set<string>()
  const merged: Card[] = []

  for (const card of [...revisit, ...due]) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    merged.push(card)
  }

  return merged
}

export function getUpcomingCards(cards: Card[]): Card[] {
  return cards
    .filter((c) => c.nextReview && new Date(c.nextReview) > new Date() && !c.flagged)
    .sort(
      (a, b) =>
        new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime()
    )
}

function reminderKind(card: Card): ReminderKind {
  if (card.flagged || card.status === 'revisit') return 'revisit'
  return 'due'
}

export function buildDeckReminders(
  deckId: string,
  deckTitle: string,
  cards: Card[]
): ReminderItem[] {
  return getActionableReminders(cards).map((card) => ({
    card,
    deckId,
    deckTitle,
    kind: reminderKind(card),
  }))
}

export function buildUpcomingReminders(
  deckId: string,
  deckTitle: string,
  cards: Card[]
): ReminderItem[] {
  return getUpcomingCards(cards).map((card) => ({
    card,
    deckId,
    deckTitle,
    kind: 'upcoming',
  }))
}

export function buildGlobalReminders(decks: { id: string; title: string; cards: Card[] }[]): ReminderItem[] {
  return decks.flatMap((deck) => buildDeckReminders(deck.id, deck.title, deck.cards))
}

export function buildGlobalUpcoming(decks: { id: string; title: string; cards: Card[] }[]): ReminderItem[] {
  return decks.flatMap((deck) => buildUpcomingReminders(deck.id, deck.title, deck.cards))
}

export function countActionableReminders(cards: Card[]): number {
  return getActionableReminders(cards).length
}
