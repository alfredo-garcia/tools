import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'
import { validateAccess } from './shared/auth.js'
import { getSchema, getResolvers } from './resolvers.js'

const PORT = Number(process.env.PORT) || 4000

async function run() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })

  app.post('/api/validate', async (request, reply) => {
    const auth = validateAccess(request)
    if (!auth.valid) {
      return reply.status(auth.status).send(auth.body)
    }
    return { ok: true }
  })

  app.addHook('preHandler', async (request, reply) => {
    const path = request.url?.split('?')[0] || ''
    if (path !== '/graphql') return
    const auth = validateAccess(request)
    if (!auth.valid) {
      return reply.status(auth.status).send(auth.body)
    }
    request.auth = auth
  })

  await app.register(mercurius, {
    schema: getSchema(),
    resolvers: getResolvers(),
    context: (request) => ({ auth: request.auth }),
  })

  app.get('/health', async () => ({ ok: true }))

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`planner-api GraphQL at http://localhost:${PORT}/graphql`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

run()
