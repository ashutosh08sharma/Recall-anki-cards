import type { DeepPartial } from 'ai'
import { z } from 'zod'
import type { ParseResult } from '../types'
import { IMPORT_LIMITS } from './importLimits'

export const flashcardSchema = z.object({
  front: z.string().describe('Clear question or prompt for the front of the card'),
  back: z.string().describe('Concise answer or explanation for the back'),
})

export const topicSchema = z.object({
  name: z.string().describe('Topic or subtopic label'),
  cards: z.array(flashcardSchema).min(1),
})

export const flashcardGenerationSchema = z.object({
  topics: z.array(topicSchema).min(1).max(8),
  summary: z.string().optional().describe('One-line deck summary'),
})

export type FlashcardGeneration = z.infer<typeof flashcardGenerationSchema>

export const AI_GENERATION_LIMITS = {
  MIN_CARDS: 3,
  MAX_CARDS: 30,
  MAX_TOPIC_LENGTH: 120,
  MAX_PROMPT_LENGTH: 2_000,
} as const

export type AIGenerateRequest = {
  topic: string
  context?: string
  cardCount?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

function trimField(value: string, maxLength: number = IMPORT_LIMITS.MAX_FIELD_LENGTH): string {
  return value.trim().slice(0, maxLength)
}

export function generationToParseResult(
  generation: DeepPartial<FlashcardGeneration> | undefined
): ParseResult | null {
  if (!generation?.topics?.length) return null

  const topics = generation.topics
    .filter((topic): topic is NonNullable<typeof topic> => topic != null)
    .map((topic) => {
      const name = trimField(topic.name || 'General', AI_GENERATION_LIMITS.MAX_TOPIC_LENGTH)
      const cards = (topic.cards ?? [])
        .filter((card): card is NonNullable<typeof card> => card != null)
        .map((card) => ({
          front: trimField(card.front ?? ''),
          back: trimField(card.back ?? ''),
        }))
        .filter((card) => card.front.length > 0 && card.back.length > 0)

      return { name: name || 'General', cards }
    })
    .filter((topic) => topic.cards.length > 0)

  if (topics.length === 0) return null

  const totalCards = topics.reduce((sum, topic) => sum + topic.cards.length, 0)
  return { topics, totalCards }
}

export function buildGenerationPrompt(input: AIGenerateRequest): string {
  const count = Math.min(
    Math.max(input.cardCount ?? 10, AI_GENERATION_LIMITS.MIN_CARDS),
    AI_GENERATION_LIMITS.MAX_CARDS
  )
  const difficulty = input.difficulty ?? 'intermediate'
  const context = input.context?.trim()

  return `Create ${count} high-quality flashcards about "${input.topic.trim()}" at a ${difficulty} level.

Requirements:
- Group cards into 1–4 logical topics with short topic names.
- Front: a focused question, term, or prompt (one idea per card).
- Back: a clear, accurate answer or explanation (2–4 sentences max when needed).
- Prefer active recall: questions should test understanding, not just definitions.
- Avoid duplicate or near-duplicate cards.
- Use plain text only — no markdown, bullets, or numbering in card fields.
${context ? `\nAdditional context from the learner:\n${context}` : ''}

Return exactly ${count} cards total across all topics.`
}
