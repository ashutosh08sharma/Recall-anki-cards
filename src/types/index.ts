export type CardStatus = 'new' | 'learning' | 'review' | 'revisit'

export interface Card {
  id: string
  front: string
  back: string
  topic: string
  status: CardStatus
  ease: number
  interval: number
  repetitions: number
  nextReview: string | null
  lastReviewed: string | null
  flagged: boolean
  createdAt: string
}

export interface Deck {
  id: string
  title: string
  description: string
  cards: Card[]
  createdAt: string
  updatedAt: string
}

export interface ParsedTopic {
  name: string
  cards: { front: string; back: string }[]
}

export interface ParseResult {
  topics: ParsedTopic[]
  totalCards: number
}

export type AppView = 'import' | 'library' | 'study' | 'quiz' | 'reminders' | 'edit'

export interface StudySession {
  deckId: string
  cardIds: string[]
  currentIndex: number
}
