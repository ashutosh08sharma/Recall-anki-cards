import type { Deck } from '../types'

const DB_NAME = 'recall-flashcards'
const DB_VERSION = 1
const STORE_NAME = 'decks'
const LEGACY_STORAGE_KEY = 'anki-flashcards-decks'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const store = tx.objectStore(STORE_NAME)
        const request = fn(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
      })
  )
}

function loadLegacyDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Deck[]
  } catch {
    return []
  }
}

async function migrateFromLocalStorage(decks: Deck[]): Promise<Deck[]> {
  if (decks.length > 0) return decks

  const legacy = loadLegacyDecks()
  if (legacy.length === 0) return []

  await saveDecks(legacy)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  return legacy
}

export async function loadDecks(): Promise<Deck[]> {
  const decks = await runTransaction('readonly', (store) => store.getAll())
  return migrateFromLocalStorage(decks)
}

export async function saveDecks(decks: Deck[]): Promise<void> {
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)

        store.clear()

        for (const deck of decks) {
          store.put(deck)
        }

        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error('Failed to save decks'))
      })
  )
}

export function exportDeckApkg(deck: Deck): string {
  const lines = [
    '# Anki Export',
    `# Deck: ${deck.title}`,
    `# Description: ${deck.description}`,
    '',
  ]

  const topics = [...new Set(deck.cards.map((c) => c.topic))]
  for (const topic of topics) {
    lines.push(`## ${topic}`)
    lines.push('')
    for (const card of deck.cards.filter((c) => c.topic === topic)) {
      lines.push(`Front: ${card.front}`)
      lines.push(`Back: ${card.back}`)
      lines.push('---')
    }
    lines.push('')
  }

  return lines.join('\n')
}
