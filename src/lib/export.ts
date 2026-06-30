import type { Deck } from '../types'
import {
  IMPORT_LIMITS,
  assertCompressedSize,
  assertDecompressedSize,
  assertSharePayloadSize,
  extractRawDecks,
  safeParseJson,
  sanitizeImportedDecks,
} from './importLimits'

export { IMPORT_LIMITS, ImportLimitError } from './importLimits'

export const EXPORT_FORMAT_VERSION = 1

export interface RecallExport {
  version: number
  app: 'recall'
  exportedAt: string
  decks: Deck[]
}

export function sortDecksByRecent(decks: Deck[]): Deck[] {
  return [...decks].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt).getTime()
    return bTime - aTime
  })
}

export function buildExport(decks: Deck[]): RecallExport {
  return {
    version: EXPORT_FORMAT_VERSION,
    app: 'recall',
    exportedAt: new Date().toISOString(),
    decks,
  }
}

export function exportDecksToJson(decks: Deck[]): string {
  return JSON.stringify(buildExport(decks), null, 2)
}

export function exportDeckToJson(deck: Deck): string {
  return exportDecksToJson([deck])
}

export function parseImportJson(raw: string): Deck[] {
  const parsed = safeParseJson(raw)
  const rawDecks = extractRawDecks(parsed)
  return sanitizeImportedDecks(rawDecks)
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  assertCompressedSize(bytes)
  return bytes
}

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decompress(bytes: Uint8Array): Promise<string> {
  assertCompressedSize(bytes)
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'))
  const text = await new Response(stream).text()
  assertDecompressedSize(text)
  return text
}

export async function encodeSharePayload(decks: Deck[]): Promise<string> {
  const json = JSON.stringify(buildExport(decks))
  const compressed = await compress(json)
  return `z.${toBase64Url(compressed)}`
}

export async function decodeSharePayload(payload: string): Promise<Deck[]> {
  const trimmed = payload.trim()
  assertSharePayloadSize(trimmed)

  if (trimmed.startsWith('z.')) {
    const json = await decompress(fromBase64Url(trimmed.slice(2)))
    return parseImportJson(json)
  }

  if (trimmed.startsWith('j.')) {
    const json = new TextDecoder().decode(fromBase64Url(trimmed.slice(2)))
    assertDecompressedSize(json)
    return parseImportJson(json)
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseImportJson(trimmed)
  }

  const json = new TextDecoder().decode(fromBase64Url(trimmed))
  assertDecompressedSize(json)
  return parseImportJson(json)
}

export async function buildShareUrl(decks: Deck[]): Promise<string> {
  const payload = await encodeSharePayload(decks)
  const base = `${window.location.origin}${window.location.pathname}`
  const url = `${base}#share=${payload}`

  if (url.length > IMPORT_LIMITS.MAX_SHARE_PAYLOAD_CHARS) {
    throw new Error(
      `This deck is too large to share via URL (${url.length} chars). Download the JSON file instead.`
    )
  }

  return url
}

export function readShareFromLocation(): string | null {
  const hash = window.location.hash
  if (hash.startsWith('#share=')) {
    const payload = decodeURIComponent(hash.slice('#share='.length))
    if (payload.length > IMPORT_LIMITS.MAX_SHARE_PAYLOAD_CHARS) return null
    return payload
  }

  const params = new URLSearchParams(window.location.search)
  const share = params.get('share')
  if (!share) return null
  const payload = decodeURIComponent(share)
  if (payload.length > IMPORT_LIMITS.MAX_SHARE_PAYLOAD_CHARS) return null
  return payload
}

export function clearShareFromLocation(): void {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.delete('share')
  window.history.replaceState(null, '', url.pathname + url.search)
}

export function downloadJsonFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'deck'
}
