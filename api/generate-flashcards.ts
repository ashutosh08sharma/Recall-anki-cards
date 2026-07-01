import {
  generateFlashcards,
  parseGenerateRequest,
} from '../server/generateFlashcards.js'

export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const input = parseGenerateRequest(body)
    const object = await generateFlashcards(input)

    // useObject expects a text stream of JSON chunks
    const encoder = new TextEncoder()
    const payload = JSON.stringify(object)
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(payload))
          controller.close()
        },
      }),
      {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    const isQuota =
      message.includes('quota') ||
      message.includes('Quota exceeded') ||
      message.includes('rate-limit')
    const status = message.includes('not configured')
      ? 503
      : isQuota
        ? 429
        : 400
    return Response.json(
      {
        error: isQuota
          ? 'Gemini API quota exceeded. Check your API key limits at ai.google.dev or try again later.'
          : message,
      },
      { status }
    )
  }
}

export async function GET(): Promise<Response> {
  return new Response('Method not allowed', { status: 405 })
}
