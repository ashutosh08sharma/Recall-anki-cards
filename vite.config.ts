import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'recall-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/generate-flashcards') {
          next()
          return
        }

        try {
          for (const [key, value] of Object.entries(env)) {
            if (value) process.env[key] = value
          }

          const { createFlashcardStream, parseGenerateRequest } = await import(
            './api/lib/generateFlashcards.ts'
          )

          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          const input = parseGenerateRequest(body)
          const result = createFlashcardStream(input)
          const response = result.toTextStreamResponse()

          res.statusCode = response.status
          response.headers.forEach((value: string, key: string) => {
            res.setHeader(key, value)
          })

          if (response.body) {
            const reader = response.body.getReader()
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Generation failed'
          const status = message.includes('not configured') ? 503 : 400
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), devApiPlugin(env)],
  }
})
