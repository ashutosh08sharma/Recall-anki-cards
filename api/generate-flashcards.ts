import {
  createFlashcardStream,
  parseGenerateRequest,
} from './lib/generateFlashcards.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await request.json()
    const input = parseGenerateRequest(body)
    const result = createFlashcardStream(input)
    return result.toTextStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    const status = message.includes('not configured') ? 503 : 400
    return Response.json({ error: message }, { status })
  }
}
