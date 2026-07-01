import { FileText } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import type { ParseResult } from '../types'

interface DeckPreviewProps {
  preview: ParseResult
  isStreaming?: boolean
  className?: string
}

export function DeckPreview({ preview, isStreaming, className = '' }: DeckPreviewProps) {
  if (preview.totalCards === 0) return null

  return (
    <Card padding="sm" className={`border-indigo-100 bg-indigo-50/30 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-900">
          {isStreaming ? (
            <>
              Generating — {preview.totalCards} card{preview.totalCards !== 1 ? 's' : ''} so far
              <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            </>
          ) : (
            <>
              Preview — {preview.totalCards} cards in {preview.topics.length}{' '}
              {preview.topics.length === 1 ? 'topic' : 'topics'}
            </>
          )}
        </span>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto">
        {preview.topics.map((topic) => (
          <div key={topic.name}>
            <Badge variant="topic">{topic.name}</Badge>
            <ul className="mt-2 space-y-1.5">
              {topic.cards.slice(0, 3).map((card, i) => (
                <li
                  key={`${topic.name}-${i}`}
                  className="border-l-2 border-indigo-200 pl-2 text-xs text-zinc-600"
                >
                  <span className="font-medium text-zinc-800">{card.front}</span>
                  <span className="text-zinc-400"> → </span>
                  <span>
                    {card.back.slice(0, 80)}
                    {card.back.length > 80 ? '…' : ''}
                  </span>
                </li>
              ))}
              {topic.cards.length > 3 && (
                <li className="pl-2 text-xs text-zinc-400">
                  +{topic.cards.length - 3} more cards
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}
