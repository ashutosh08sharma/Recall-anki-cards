import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Card, Deck, ParsedTopic } from '../types'
import { generateId } from '../lib/id'
import { sortDecksByRecent } from '../lib/export'
import { loadDecks, saveDecks } from '../lib/storage'
import { createDefaultCard, rateCard, type ReviewRating } from '../lib/spacedRepetition'

function cloneDeckForImport(deck: Deck): Deck {
  const now = new Date().toISOString()
  return {
    ...deck,
    id: generateId(),
    createdAt: deck.createdAt || now,
    updatedAt: now,
    cards: deck.cards.map((card) => ({
      ...card,
      id: generateId(),
    })),
  }
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hydrated = useRef(false)

  const sortedDecks = useMemo(() => sortDecksByRecent(decks), [decks])

  useEffect(() => {
    let cancelled = false

    loadDecks()
      .then((stored) => {
        if (!cancelled) {
          setDecks(sortDecksByRecent(stored))
          hydrated.current = true
        }
      })
      .catch(() => {
        if (!cancelled) hydrated.current = true
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    saveDecks(decks).catch(() => {
      /* persistence failure is non-fatal; data remains in memory */
    })
  }, [decks])

  const createDeck = useCallback(
    (title: string, description: string, topics: ParsedTopic[]) => {
      const now = new Date().toISOString()
      const cards: Card[] = topics.flatMap((topic) =>
        topic.cards.map((c) =>
          createDefaultCard(c.front, c.back, topic.name, generateId())
        )
      )

      const deck: Deck = {
        id: generateId(),
        title,
        description,
        cards,
        createdAt: now,
        updatedAt: now,
      }

      setDecks((prev) => sortDecksByRecent([deck, ...prev]))
      return deck.id
    },
    []
  )

  const importDecks = useCallback((incoming: Deck[]) => {
    const cloned = incoming.map(cloneDeckForImport)
    setDecks((prev) => sortDecksByRecent([...cloned, ...prev]))
    return cloned.length
  }, [])

  const deleteDeck = useCallback((deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId))
  }, [])

  const updateDeck = useCallback(
    (deckId: string, updates: { title?: string; description?: string }) => {
      setDecks((prev) =>
        sortDecksByRecent(
          prev.map((deck) => {
            if (deck.id !== deckId) return deck
            return {
              ...deck,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          })
        )
      )
    },
    []
  )

  const addCard = useCallback(
    (deckId: string, front: string, back: string, topic: string) => {
      setDecks((prev) =>
        sortDecksByRecent(
          prev.map((deck) => {
            if (deck.id !== deckId) return deck
            return {
              ...deck,
              updatedAt: new Date().toISOString(),
              cards: [
                ...deck.cards,
                createDefaultCard(front, back, topic, generateId()),
              ],
            }
          })
        )
      )
    },
    []
  )

  const removeCard = useCallback((deckId: string, cardId: string) => {
    setDecks((prev) =>
      sortDecksByRecent(
        prev.map((deck) => {
          if (deck.id !== deckId) return deck
          return {
            ...deck,
            updatedAt: new Date().toISOString(),
            cards: deck.cards.filter((c) => c.id !== cardId),
          }
        })
      )
    )
  }, [])

  const updateCard = useCallback(
    (deckId: string, cardId: string, updater: (card: Card) => Card) => {
      setDecks((prev) =>
        sortDecksByRecent(
          prev.map((deck) => {
            if (deck.id !== deckId) return deck
            return {
              ...deck,
              updatedAt: new Date().toISOString(),
              cards: deck.cards.map((c) => (c.id === cardId ? updater(c) : c)),
            }
          })
        )
      )
    },
    []
  )

  const updateCardFields = useCallback(
    (
      deckId: string,
      cardId: string,
      fields: Partial<Pick<Card, 'front' | 'back' | 'topic'>>
    ) => {
      updateCard(deckId, cardId, (card) => ({ ...card, ...fields }))
    },
    [updateCard]
  )

  const rateDeckCard = useCallback(
    (deckId: string, cardId: string, rating: ReviewRating) => {
      updateCard(deckId, cardId, (card) => rateCard(card, rating))
    },
    [updateCard]
  )

  const toggleFlag = useCallback(
    (deckId: string, cardId: string) => {
      updateCard(deckId, cardId, (card) => ({ ...card, flagged: !card.flagged }))
    },
    [updateCard]
  )

  const getDeck = useCallback(
    (deckId: string) => sortedDecks.find((d) => d.id === deckId),
    [sortedDecks]
  )

  return {
    decks: sortedDecks,
    isLoading,
    createDeck,
    importDecks,
    deleteDeck,
    updateDeck,
    addCard,
    removeCard,
    updateCard,
    updateCardFields,
    rateDeckCard,
    toggleFlag,
    getDeck,
  }
}
