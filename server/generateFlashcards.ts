/// <reference types="node" />
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

export const flashcardGenerationSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().describe('Topic or subtopic label'),
        cards: z
          .array(
            z.object({
              front: z.string().describe('Clear question or prompt for the front'),
              back: z.string().describe('Concise answer or explanation for the back'),
            })
          )
          .min(1),
      })
    )
    .min(1)
    .max(8),
  summary: z.string().optional().describe('One-line deck summary'),
})

export type FlashcardGeneration = z.infer<typeof flashcardGenerationSchema>

const LIMITS = {
  MIN_CARDS: 3,
  MAX_CARDS: 20,
  MAX_TOPIC_LENGTH: 120,
  MAX_PROMPT_LENGTH: 2_000,
} as const

/** Gemini 3 Flash — fast structured output for serverless. */
const GENERATION_MODEL = 'gemini-3-flash-preview'

export type AIGenerateRequest = {
  topic: string
  context?: string
  cardCount?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

export function parseGenerateRequest(body: unknown): AIGenerateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body')
  }

  const data = body as Record<string, unknown>
  const topic = typeof data.topic === 'string' ? data.topic.trim() : ''

  if (!topic) {
    throw new Error('Topic is required')
  }

  if (topic.length > LIMITS.MAX_TOPIC_LENGTH) {
    throw new Error('Topic is too long')
  }

  const context =
    typeof data.context === 'string'
      ? data.context.trim().slice(0, LIMITS.MAX_PROMPT_LENGTH)
      : undefined

  const cardCount =
    typeof data.cardCount === 'number' && Number.isFinite(data.cardCount)
      ? data.cardCount
      : undefined

  const difficulty =
    data.difficulty === 'beginner' ||
    data.difficulty === 'intermediate' ||
    data.difficulty === 'advanced'
      ? data.difficulty
      : undefined

  return { topic, context, cardCount, difficulty }
}

function buildGenerationPrompt(input: AIGenerateRequest): string {
  const count = Math.min(
    Math.max(input.cardCount ?? 10, LIMITS.MIN_CARDS),
    LIMITS.MAX_CARDS
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

export async function generateFlashcards(input: AIGenerateRequest): Promise<FlashcardGeneration> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your environment.')
  }

  const { object } = await generateObject({
    model: google(GENERATION_MODEL),
    schema: flashcardGenerationSchema,
    prompt: buildGenerationPrompt(input),
  })

  return object
}
