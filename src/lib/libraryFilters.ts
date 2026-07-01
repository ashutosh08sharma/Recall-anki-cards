import type { Deck } from '../types'
import { getDueCards, getRevisitCards } from './spacedRepetition'

export interface LibraryFilters {
  q: string
  topic: string | null
  due: boolean
  reminders: boolean
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  q: '',
  topic: null,
  due: false,
  reminders: false,
}

const FILTER_PARAM_KEYS = ['q', 'topic', 'due', 'reminders'] as const

export function hasLibraryFilterParams(search: string): boolean {
  const params = new URLSearchParams(search)
  return FILTER_PARAM_KEYS.some((key) => {
    const value = params.get(key)
    if (!value) return false
    if (key === 'due' || key === 'reminders') return value === '1'
    return value.trim().length > 0
  })
}

export function parseLibraryFiltersFromSearch(search: string): LibraryFilters {
  const params = new URLSearchParams(search)
  const q = params.get('q')?.trim() ?? ''
  const topic = params.get('topic')?.trim() || null
  const due = params.get('due') === '1'
  const reminders = params.get('reminders') === '1'

  return { q, topic, due, reminders }
}

export function syncLibraryFiltersToUrl(filters: LibraryFilters): void {
  const url = new URL(window.location.href)

  if (filters.q.trim()) {
    url.searchParams.set('q', filters.q.trim())
  } else {
    url.searchParams.delete('q')
  }

  if (filters.topic) {
    url.searchParams.set('topic', filters.topic)
  } else {
    url.searchParams.delete('topic')
  }

  if (filters.due) {
    url.searchParams.set('due', '1')
  } else {
    url.searchParams.delete('due')
  }

  if (filters.reminders) {
    url.searchParams.set('reminders', '1')
  } else {
    url.searchParams.delete('reminders')
  }

  const search = url.searchParams.toString()
  const nextUrl = url.pathname + (search ? `?${search}` : '') + url.hash

  if (nextUrl !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', nextUrl)
  }
}

export function hasActiveLibraryFilters(filters: LibraryFilters): boolean {
  return (
    filters.q.trim().length > 0 ||
    filters.topic !== null ||
    filters.due ||
    filters.reminders
  )
}

export function collectDeckTopics(decks: Deck[]): string[] {
  const topics = new Set<string>()
  for (const deck of decks) {
    for (const card of deck.cards) {
      if (card.topic.trim()) topics.add(card.topic)
    }
  }
  return [...topics].sort((a, b) => a.localeCompare(b))
}

function matchesSearch(deck: Deck, query: string): boolean {
  const needle = query.toLowerCase()
  if (deck.title.toLowerCase().includes(needle)) return true
  if (deck.description.toLowerCase().includes(needle)) return true
  return deck.cards.some(
    (card) =>
      card.front.toLowerCase().includes(needle) ||
      card.back.toLowerCase().includes(needle) ||
      card.topic.toLowerCase().includes(needle)
  )
}

function matchesTopic(deck: Deck, topic: string): boolean {
  const needle = topic.toLowerCase()
  return deck.cards.some((card) => card.topic.toLowerCase() === needle)
}

export function filterDecks(decks: Deck[], filters: LibraryFilters): Deck[] {
  return decks.filter((deck) => {
    if (filters.q && !matchesSearch(deck, filters.q)) return false
    if (filters.topic && !matchesTopic(deck, filters.topic)) return false
    if (filters.due && getDueCards(deck.cards).length === 0) return false
    if (
      filters.reminders &&
      getDueCards(deck.cards).length === 0 &&
      getRevisitCards(deck.cards).length === 0
    ) {
      return false
    }
    return true
  })
}
