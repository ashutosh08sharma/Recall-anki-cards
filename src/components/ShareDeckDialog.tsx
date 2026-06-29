import { useState } from 'react'
import { Check, Copy, Download, Link2, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import type { Deck } from '../types'
import {
  buildShareUrl,
  downloadJsonFile,
  exportDeckToJson,
  exportDecksToJson,
  slugifyFilename,
} from '../lib/export'

interface ShareDeckDialogProps {
  decks: Deck[]
  onClose: () => void
}

export function ShareDeckDialog({ decks, onClose }: ShareDeckDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const isSingle = decks.length === 1
  const label = isSingle ? decks[0].title : `${decks.length} decks`
  const cardCount = decks.reduce((sum, d) => sum + d.cards.length, 0)

  const handleDownload = () => {
    const json = isSingle ? exportDeckToJson(decks[0]) : exportDecksToJson(decks)
    const filename = isSingle
      ? `${slugifyFilename(decks[0].title)}.recall.json`
      : `recall-export-${new Date().toISOString().slice(0, 10)}.json`
    downloadJsonFile(filename, json)
  }

  const handleCreateLink = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = await buildShareUrl(decks)
      setShareUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create share link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-zinc-900 pr-8">
          Share {isSingle ? 'Deck' : 'Decks'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {label} · {cardCount} cards — share with anyone using Recall
        </p>

        <div className="mt-5 space-y-3">
          <Button className="w-full" variant="secondary" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download JSON file
          </Button>

          {!shareUrl ? (
            <Button className="w-full" onClick={handleCreateLink} disabled={loading}>
              <Link2 className="h-4 w-4" />
              {loading ? 'Creating link…' : 'Create share link'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 truncate"
                />
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Opening this link imports the deck automatically.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
