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
    const status = message.includes('not configured') ? 503 : 400
    return Response.json({ error: message }, { status })
  }
}

export async function GET(): Promise<Response> {
  return new Response('Method not allowed', { status: 405 })
}
