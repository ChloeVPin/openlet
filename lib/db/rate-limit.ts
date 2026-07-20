import { eq, lt, sql } from 'drizzle-orm'
import { db } from './index'
import { rateLimits } from './schema'

/**
 * Token-bucket rate limiter backed by Postgres.
 * Returns true if the request is allowed, false if rate-limited.
 *
 * Uses a single row per key with an atomic upsert so concurrent requests
 * don't race past the limit. Rows are auto-deleted after the window expires.
 *
 * @param key  Unique identifier (e.g. "card-meta:user_abc123")
 * @param max  Max requests allowed within the window
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number = 30,
  windowMs: number = 60_000,
): Promise<boolean> {
  // Prune stale rows for this key
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()))

  const now = new Date()
  const resetAt = new Date(Date.now() + windowMs)

  // Atomic upsert: increment count or insert a fresh row
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`${rateLimits.count} + 1`,
        resetAt,
      },
    })
    .returning()

  return row ? row.count <= max : true
}
