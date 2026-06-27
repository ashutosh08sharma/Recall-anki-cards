import { useMemo, useState } from 'react'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Badge } from '../ui/Badge'
import type { Card as CardType, Deck } from '../../types'

interface EditDeckViewProps {
  deck: Deck
  onUpdateDeck: (updates: { title?: string; description?: string }) => void
  onUpdateCard: (
    cardId: string,
    fields: Partial<Pick<CardType, 'front' | 'back' | 'topic'>>
  ) => void
  onAddCard: (front: string, back: string, topic: string) => void
  onRemoveCard: (cardId: string) => void
  onExit: () => void
}

export function EditDeckView({
  deck,
  onUpdateDeck,
  onUpdateCard,
  onAddCard,
  onRemoveCard,
  onExit,
}: EditDeckViewProps) {
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newTopic, setNewTopic] = useState('General')

  const topics = useMemo(
    () => [...new Set(deck.cards.map((c) => c.topic))],
    [deck.cards]
  )

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase().trim()
    return deck.cards.filter((c) => {
      if (topicFilter && c.topic !== topicFilter) return false
      if (!q) return true
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q)
      )
    })
  }, [deck.cards, search, topicFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, CardType[]>()
    for (const card of filteredCards) {
      const list = map.get(card.topic) ?? []
      list.push(card)
      map.set(card.topic, list)
    }
    return [...map.entries()]
  }, [filteredCards])

  const handleAddCard = () => {
    if (!newFront.trim() || !newBack.trim()) return
    onAddCard(newFront.trim(), newBack.trim(), newTopic.trim() || 'General')
    setNewFront('')
    setNewBack('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Edit Deck
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Changes save automatically
          </p>
        </div>
        <Badge>{deck.cards.length} cards</Badge>
      </div>

      <Card className="space-y-4">
        <Input
          label="Title"
          value={deck.title}
          onChange={(e) => onUpdateDeck({ title: e.target.value })}
        />
        <Input
          label="Description"
          value={deck.description}
          onChange={(e) => onUpdateDeck({ description: e.target.value })}
          placeholder="Optional description"
        />
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            placeholder="Search cards…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={topicFilter ?? ''}
          onChange={(e) => setTopicFilter(e.target.value || null)}
          className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {grouped.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-zinc-500">
            {deck.cards.length === 0
              ? 'No cards yet. Add one below.'
              : 'No cards match your search.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([topic, cards]) => (
            <section key={topic}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="topic">{topic}</Badge>
                <span className="text-xs text-zinc-400">{cards.length} cards</span>
              </div>
              <div className="space-y-3">
                {cards.map((card) => (
                  <Card key={card.id} padding="sm" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={card.topic}
                        onChange={(e) =>
                          onUpdateCard(card.id, { topic: e.target.value })
                        }
                        className="text-xs font-medium rounded-md border border-zinc-200 px-2 py-1 text-indigo-700 bg-indigo-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-300 w-40"
                        aria-label="Card topic"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this card?')) onRemoveCard(card.id)
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Delete card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                          Front
                        </label>
                        <textarea
                          value={card.front}
                          onChange={(e) =>
                            onUpdateCard(card.id, { front: e.target.value })
                          }
                          rows={3}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm resize-y focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">
                          Back
                        </label>
                        <textarea
                          value={card.back}
                          onChange={(e) =>
                            onUpdateCard(card.id, { back: e.target.value })
                          }
                          rows={3}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm resize-y focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card className="space-y-4 border-dashed border-indigo-200 bg-indigo-50/20">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextArea
            label="Front"
            placeholder="Question or prompt"
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            className="min-h-[80px]"
          />
          <TextArea
            label="Back"
            placeholder="Answer"
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <Input
          label="Topic"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="General"
        />
        <Button
          onClick={handleAddCard}
          disabled={!newFront.trim() || !newBack.trim()}
        >
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </Card>
    </div>
  )
}
