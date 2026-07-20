import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let _db: PostgresJsDatabase<typeof schema> | null = null
let _client: ReturnType<typeof postgres> | null = null

/**
 * Lazily initialised DB client so Vercel serverless cold starts don't
 * crash at import-time when env vars aren't available yet.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db
  // Prefer the Supabase Vercel integration's pooler URL (IPv4).
  // Falls back to DATABASE_URL for local dev or manual setups.
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!url) throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required')

  const isPooler = /:6543\b|pooler\.supabase/i.test(url)
  _client = postgres(url, {
    max: isPooler ? 10 : 20,
    idle_timeout: 20,
    connect_timeout: 8,
    max_lifetime: 60 * 30,
    prepare: !isPooler,
    ssl: 'require',
  })
  _db = drizzle(_client, { schema })
  return _db
}

/** Eager accessor for imports that expect `db` as a module-level export. */
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_, prop, receiver) {
      const target = getDb()
      return Reflect.get(target as unknown as Record<string | symbol, unknown>, prop, receiver)
    },
  },
)
