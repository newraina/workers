/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Env, Hono } from 'hono'
import { cors } from 'hono/cors'

import { Env as CloudflareEnv, OTTER } from './utils/constants'
import { allowedOrigin } from './utils/cors'
import { doSearch, insertInto, isTable, SearchQuery } from './utils/db'

// const envAdapter = env<Bindings>()

interface HonoEnv extends Env {
  Bindings: CloudflareEnv
}

const app = new Hono<HonoEnv>()

app.get('/', (c) => c.text(OTTER))

app.use('/search', cors({ origin: allowedOrigin }))

app.get('/search', async (c) => {
  const body = c.req.query() as Record<keyof SearchQuery, any>
  const result = await doSearch(body as SearchQuery, c.env.POLYSEARCH_DB)
  return c.json(result)
})

app.post('/search', async (c) => {
  const body = await c.req.json<SearchQuery>()
  const result = await doSearch(body, c.env.POLYSEARCH_DB)
  return c.json(result)
})

app.post('/insert/:table', async (c) => {
  const table = c.req.param('table')
  const body = await c.req.json()

  if (!isTable(table) || !body) {
    return c.text('table is required', 400)
  }
  const result = await insertInto(table, body, c.env.POLYSEARCH_DB)
  return c.json(result)
})

app.onError((err, c) => {
  console.error(`${err}`)
  return c.text(`path: ${c.req.url}`, 400)
})

export default app
