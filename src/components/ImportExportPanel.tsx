import { useState } from 'react'
import { Check, Upload, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import type { Deck } from '../types'
import { decodeSharePayload, parseImportJson } from '../lib/export'

interface ImportShareDialogProps {
  decks: Deck[]
  onImport: () => void
  onDismiss: () => void
}

export function ImportShareDialog({ decks, onImport, onDismiss }: ImportShareDialogProps) {
  const cardCount = decks.reduce((sum, d) => sum + d.cards.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-zinc-900 pr-8">Import shared decks?</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Someone shared {decks.length} deck{decks.length !== 1 ? 's' : ''} with you ({cardCount}{' '}
          cards).
        </p>

        <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {decks.map((deck) => (
            <li
              key={deck.id}
              className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-zinc-800 truncate">{deck.title}</span>
              <Badge>{deck.cards.length} cards</Badge>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={onImport}>
            <Check className="h-4 w-4" />
            Import
          </Button>
          <Button className="flex-1" variant="secondary" onClick={onDismiss}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}

interface ImportFromExportProps {
  onImport: (decks: Deck[]) => void
}

export function ImportFromExport({ onImport }: ImportFromExportProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Deck[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    setPreview(null)
    try {
      const text = await file.text()
      const decks = parseImportJson(text)
      if (decks.length === 0) throw new Error('No decks found in file')
      setPreview(decks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid import file')
    }
  }

  const handleUrl = async () => {
    setError(null)
    setPreview(null)
    setLoading(true)
    try {
      const trimmed = url.trim()
      let payload = trimmed

      if (trimmed.includes('#share=')) {
        payload = decodeURIComponent(trimmed.split('#share=')[1]?.split('&')[0] ?? '')
      } else if (trimmed.includes('share=')) {
        payload = decodeURIComponent(new URL(trimmed).searchParams.get('share') ?? '')
      }

      const decks = await decodeSharePayload(payload)
      if (decks.length === 0) throw new Error('No decks found in link')
      setPreview(decks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid share link')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!preview) return
    onImport(preview)
    setPreview(null)
    setUrl('')
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Import from Recall export</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Upload a .json file or paste a share link from another user
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
        <Upload className="h-6 w-6 text-zinc-400 mb-2" />
        <span className="text-sm font-medium text-zinc-700">Upload .recall.json file</span>
        <span className="text-xs text-zinc-400 mt-1">Click to browse</span>
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </label>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste share link…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <Button variant="secondary" onClick={handleUrl} disabled={!url.trim() || loading}>
          {loading ? '…' : 'Load'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {preview && (
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <p className="text-sm font-medium text-zinc-800">
            Ready to import {preview.length} deck{preview.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-1.5">
            {preview.map((deck) => (
              <li key={deck.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700 truncate">{deck.title}</span>
                <Badge>{deck.cards.length} cards</Badge>
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={handleImport}>
            <Check className="h-4 w-4" />
            Import {preview.length} deck{preview.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </Card>
  )
}
