import type { ParsedTopic, ParseResult } from '../types'

function clean(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n')
}

function detectTopic(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  if (/^#{1,3}\s+/.test(trimmed)) {
    return trimmed.replace(/^#+\s*/, '').trim()
  }
  if (/^\[.+\]$/.test(trimmed)) {
    return trimmed.slice(1, -1).trim()
  }
  if (/^(Topic|Section):\s*/i.test(trimmed)) {
    return trimmed.replace(/^(Topic|Section):\s*/i, '').trim()
  }
  if (
    trimmed.length <= 60 &&
    /^[A-Z][A-Za-z0-9\s&/-]+$/.test(trimmed) &&
    !trimmed.endsWith('?') &&
    !trimmed.includes('.')
  ) {
    return trimmed.replace(/:$/, '')
  }
  return null
}

function parseQAPairs(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []

  const qaRegex =
    /(?:^|\n)\s*(?:Q(?:uestion)?|Front)\s*[:\-]\s*(.+?)(?:\n\s*(?:A(?:nswer)?|Back)\s*[:\-]\s*(.+?))(?=\n\s*(?:Q(?:uestion)?|Front)\s*[:\-]|\n#{1,3}\s|\n\[|$)/gis

  let match: RegExpExecArray | null
  while ((match = qaRegex.exec(text)) !== null) {
    const front = clean(match[1])
    const back = clean(match[2])
    if (front && back) cards.push({ front, back })
  }

  const numberedRegex =
    /(?:^|\n)\s*(\d+[\.)]\s*.+?\?)\s*\n\s*(.+?)(?=\n\s*\d+[\.)]|\n#{1,3}\s|\n\[|$)/gis

  while ((match = numberedRegex.exec(text)) !== null) {
    const front = clean(match[1].replace(/^\d+[\.)]\s*/, ''))
    const back = clean(match[2])
    if (front && back && !cards.some((c) => c.front === front)) {
      cards.push({ front, back })
    }
  }

  return cards
}

function parseFrontBackBlocks(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  const blocks = text.split(/\n(?:---|===|\*\*\*)\n/)

  for (const block of blocks) {
    const frontMatch = block.match(/(?:^|\n)\s*Front\s*[:\-]\s*([\s\S]+?)(?:\n\s*Back\s*[:\-]|$)/i)
    const backMatch = block.match(/\n\s*Back\s*[:\-]\s*([\s\S]+)$/i)

    if (frontMatch && backMatch) {
      const front = clean(frontMatch[1])
      const back = clean(backMatch[1])
      if (front && back) cards.push({ front, back })
    }
  }

  return cards
}

function parseDefinitionPairs(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    const termMatch = trimmed.match(/^[-*•]\s*(.+?)\s*[:\-–—]\s*(.+)$/)
    if (termMatch) {
      cards.push({ front: clean(termMatch[1]), back: clean(termMatch[2]) })
      continue
    }
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*\s*[:\-–—]?\s*(.+)$/)
    if (boldMatch) {
      cards.push({ front: clean(boldMatch[1]), back: clean(boldMatch[2]) })
    }
  }

  return cards
}

function parseByTopics(rawText: string): ParsedTopic[] {
  const lines = rawText.split('\n')
  const topics: ParsedTopic[] = []
  let currentTopic = 'General'
  let buffer: string[] = []

  const flush = () => {
    const sectionText = buffer.join('\n').trim()
    if (!sectionText) return

    const cards = [
      ...parseQAPairs(sectionText),
      ...parseFrontBackBlocks(sectionText),
      ...parseDefinitionPairs(sectionText),
    ]

    if (cards.length === 0) {
      const paragraphs = sectionText.split(/\n\n+/).filter((p) => p.trim().length > 20)
      if (paragraphs.length >= 2) {
        for (let i = 0; i < paragraphs.length - 1; i += 2) {
          cards.push({ front: clean(paragraphs[i]), back: clean(paragraphs[i + 1]) })
        }
      } else if (paragraphs.length === 1) {
        const sentences = paragraphs[0].match(/[^.!?]+[.!?]+/g) ?? []
        if (sentences.length >= 2) {
          const mid = Math.ceil(sentences.length / 2)
          cards.push({
            front: `What are the key points about ${currentTopic}?`,
            back: clean(sentences.slice(mid).join(' ')),
          })
        }
      }
    }

    if (cards.length > 0) {
      const existing = topics.find((t) => t.name === currentTopic)
      if (existing) {
        existing.cards.push(...cards)
      } else {
        topics.push({ name: currentTopic, cards })
      }
    }

    buffer = []
  }

  for (const line of lines) {
    const topic = detectTopic(line)
    if (topic && buffer.length > 0) {
      flush()
      currentTopic = topic
      continue
    }
    if (topic) {
      currentTopic = topic
      continue
    }
    buffer.push(line)
  }

  flush()
  return topics
}

export function parseTextToTopics(
  rawText: string,
  fallbackTitle?: string
): ParseResult {
  const text = rawText.trim()
  if (!text) return { topics: [], totalCards: 0 }

  let topics = parseByTopics(text)

  if (topics.length === 0) {
    const allCards = [
      ...parseQAPairs(text),
      ...parseFrontBackBlocks(text),
      ...parseDefinitionPairs(text),
    ]

    if (allCards.length > 0) {
      topics = [{ name: fallbackTitle ?? 'General', cards: allCards }]
    } else {
      const chunks = text.split(/\n\n+/).filter((c) => c.trim())
      const cards = chunks.map((chunk, i) => ({
        front: `Concept ${i + 1}: Summarize this`,
        back: clean(chunk),
      }))
      topics = [{ name: fallbackTitle ?? 'General', cards }]
    }
  }

  const totalCards = topics.reduce((sum, t) => sum + t.cards.length, 0)
  return { topics, totalCards }
}

export function parseStructuredInput(
  title: string,
  frontText: string,
  backText: string
): ParseResult {
  const fronts = frontText.split(/\n---+\n|\n\n+/).map(clean).filter(Boolean)
  const backs = backText.split(/\n---+\n|\n\n+/).map(clean).filter(Boolean)

  const count = Math.max(fronts.length, backs.length)
  const cards: { front: string; back: string }[] = []

  for (let i = 0; i < count; i++) {
    cards.push({
      front: fronts[i] ?? `Card ${i + 1}`,
      back: backs[i] ?? fronts[i] ?? '',
    })
  }

  return {
    topics: [{ name: title || 'Untitled Deck', cards }],
    totalCards: cards.length,
  }
}
