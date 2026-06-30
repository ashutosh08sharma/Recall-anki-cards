import type { Card, CardStatus, Deck } from '../types'
import { createDefaultCard } from './spacedRepetition'
import { generateId } from './id'

export const IMPORT_LIMITS = {
  MAX_DECKS: 50,
  MAX_CARDS_PER_DECK: 2_000,
  MAX_TOTAL_CARDS: 5_000,
  MAX_FIELD_LENGTH: 10_000,
  MAX_JSON_CHARS: 2 * 1024 * 1024,
  MAX_COMPRESSED_BYTES: 512 * 1024,
  MAX_DECOMPRESSED_BYTES: 2 * 1024 * 1024,
  MAX_SHARE_PAYLOAD_CHARS: 6_000,
  MAX_UPLOAD_FILE_BYTES: 2 * 1024 * 1024,
} as const

export class ImportLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportLimitError'
  }
}

const VALID_STATUSES = new Set<CardStatus>(['new', 'learning', 'review', 'revisit'])

function rejectPrototypeKeys(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype'
}

export function safeParseJson(raw: string): unknown {
  assertJsonSize(raw)
  return JSON.parse(raw, (key, value) => (rejectPrototypeKeys(key) ? undefined : value))
}

export function assertJsonSize(raw: string): void {
  if (raw.length > IMPORT_LIMITS.MAX_JSON_CHARS) {
    throw new ImportLimitError(
      `Import file is too large (max ${Math.round(IMPORT_LIMITS.MAX_JSON_CHARS / 1024 / 1024)} MB)`
    )
  }
}

export function assertCompressedSize(bytes: Uint8Array): void {
  if (bytes.length > IMPORT_LIMITS.MAX_COMPRESSED_BYTES) {
    throw new ImportLimitError('Compressed import payload is too large')
  }
}

export function assertDecompressedSize(text: string): void {
  if (text.length > IMPORT_LIMITS.MAX_DECOMPRESSED_BYTES) {
    throw new ImportLimitError('Decompressed import payload is too large')
  }
}

export function assertSharePayloadSize(payload: string): void {
  if (payload.length > IMPORT_LIMITS.MAX_SHARE_PAYLOAD_CHARS) {
    throw new ImportLimitError('Share link payload is too large')
  }
}

function sanitizeString(value: unknown, field: string): string {
  if (value == null) return ''
  if (typeof value !== 'string') {
    throw new ImportLimitError(`Invalid ${field}: expected text`)
  }
  if (value.length > IMPORT_LIMITS.MAX_FIELD_LENGTH) {
    throw new ImportLimitError(
      `${field} exceeds ${IMPORT_LIMITS.MAX_FIELD_LENGTH.toLocaleString()} characters`
    )
  }
  return value
}

function sanitizeOptionalString(value: unknown): string | null {
  if (value == null) return null
  const str = sanitizeString(value, 'field')
  return str || null
}

function sanitizeStatus(value: unknown): CardStatus {
  if (typeof value === 'string' && VALID_STATUSES.has(value as CardStatus)) {
    return value as CardStatus
  }
  return 'new'
}

function sanitizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function sanitizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function sanitizeCard(raw: unknown): Card | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>

  const front = sanitizeString(input.front, 'card front')
  const back = sanitizeString(input.back, 'card back')
  if (!front && !back) return null

  const topic = sanitizeString(input.topic, 'topic') || 'General'
  const id = typeof input.id === 'string' && input.id ? input.id : generateId()

  const base = createDefaultCard(front || 'Untitled', back || front, topic, id)

  return {
    ...base,
    status: sanitizeStatus(input.status),
    ease: sanitizeNumber(input.ease, base.ease),
    interval: sanitizeNumber(input.interval, base.interval),
    repetitions: sanitizeNumber(input.repetitions, base.repetitions),
    nextReview: sanitizeOptionalString(input.nextReview),
    lastReviewed: sanitizeOptionalString(input.lastReviewed),
    flagged: sanitizeBoolean(input.flagged),
    createdAt: sanitizeOptionalString(input.createdAt) ?? base.createdAt,
  }
}

function sanitizeDeck(raw: unknown): Deck | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>

  if (!Array.isArray(input.cards)) return null

  const title = sanitizeString(input.title, 'deck title') || 'Untitled Deck'
  const description = sanitizeString(input.description, 'deck description')
  const now = new Date().toISOString()
  const id = typeof input.id === 'string' && input.id ? input.id : generateId()

  if (input.cards.length > IMPORT_LIMITS.MAX_CARDS_PER_DECK) {
    throw new ImportLimitError(
      `Deck "${title}" has too many cards (max ${IMPORT_LIMITS.MAX_CARDS_PER_DECK.toLocaleString()})`
    )
  }

  const cards: Card[] = []
  for (const item of input.cards) {
    const card = sanitizeCard(item)
    if (card) cards.push(card)
  }

  if (cards.length === 0) return null

  return {
    id,
    title,
    description,
    cards,
    createdAt: sanitizeOptionalString(input.createdAt) ?? now,
    updatedAt: sanitizeOptionalString(input.updatedAt) ?? now,
  }
}

export function sanitizeImportedDecks(rawDecks: unknown[]): Deck[] {
  if (rawDecks.length > IMPORT_LIMITS.MAX_DECKS) {
    throw new ImportLimitError(
      `Too many decks (max ${IMPORT_LIMITS.MAX_DECKS})`
    )
  }

  const decks: Deck[] = []
  let totalCards = 0

  for (const item of rawDecks) {
    const deck = sanitizeDeck(item)
    if (!deck) continue

    totalCards += deck.cards.length
    if (totalCards > IMPORT_LIMITS.MAX_TOTAL_CARDS) {
      throw new ImportLimitError(
        `Too many cards across all decks (max ${IMPORT_LIMITS.MAX_TOTAL_CARDS.toLocaleString()})`
      )
    }

    decks.push(deck)
  }

  if (decks.length === 0) {
    throw new ImportLimitError('No valid decks found in import')
  }

  return decks
}

export function extractRawDecks(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    if (Array.isArray(record.decks)) {
      if (record.app != null && record.app !== 'recall') {
        throw new ImportLimitError('Unrecognized export format')
      }
      return record.decks
    }
    if (Array.isArray(record.cards)) {
      return [parsed]
    }
  }

  throw new ImportLimitError('Invalid import file')
}
