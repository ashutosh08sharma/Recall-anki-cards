import type { Card, Deck } from '../types'

export const TIMER_OPTIONS = [
  { label: 'No timer', value: 0 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
] as const

export const DECK_QUIZ_SIZE = 10
export const GLOBAL_QUIZ_SIZE = 15
export const MIN_GLOBAL_QUIZ_POOL = 4

export interface QuizQuestion {
  cardId: string
  front: string
  back: string
  topic: string
  deckId: string
  deckTitle: string
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function toQuestion(deck: Deck, card: Card): QuizQuestion {
  return {
    cardId: card.id,
    front: card.front,
    back: card.back,
    topic: card.topic,
    deckId: deck.id,
    deckTitle: deck.title,
  }
}

export function collectDeckQuestions(deck: Deck): QuizQuestion[] {
  return deck.cards.map((card) => toQuestion(deck, card))
}

export function collectGlobalQuestions(decks: Deck[]): QuizQuestion[] {
  return decks.flatMap((deck) => collectDeckQuestions(deck))
}

export function pickQuizQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
  if (questions.length === 0) return []
  return shuffle(questions).slice(0, Math.min(count, questions.length))
}

export function buildAnswerOptions(
  question: QuizQuestion,
  pool: QuizQuestion[]
): string[] {
  const wrong = pool
    .filter((q) => q.cardId !== question.cardId && q.back !== question.back)
    .map((q) => q.back)

  const uniqueWrong = [...new Set(wrong)]
  const distractors = shuffle(uniqueWrong).slice(0, 3)
  return shuffle([question.back, ...distractors])
}

export function countGlobalQuizPool(decks: Deck[]): number {
  return collectGlobalQuestions(decks).length
}
