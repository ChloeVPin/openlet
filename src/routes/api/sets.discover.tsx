import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { sets, cards } from '../../../lib/db/schema'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/sets/discover')({
  server: {
    handlers: {
      GET: async () => {
        const { supabase, flushCookies } = createClient()
        const {
          data: { user: payload },
        } = await supabase.auth.getUser()
        flushCookies()
        if (!payload) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Rate limit: max 30 discover queries per minute per user
        const allowed = await checkRateLimit(`discover:${payload.id}`, 30, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const publicSets = await db
          .select({
            id: sets.id,
            userId: sets.userId,
            title: sets.title,
            description: sets.description,
            subject: sets.subject,
            cover: sets.cover,
            updatedAt: sets.updatedAt,
          })
          .from(sets)
          .where(eq(sets.visibility, 'public'))
          .orderBy(desc(sets.updatedAt))
          .limit(30)

        if (publicSets.length === 0) {
          return new Response(JSON.stringify({ sets: [] }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const setIds = publicSets.map((s) => s.id)

        const cardCounts = await db
          .select({
            setId: cards.setId,
            count: sql<number>`count(*)::int`,
          })
          .from(cards)
          .where(inArray(cards.setId, setIds))
          .groupBy(cards.setId)

        const countMap = new Map(cardCounts.map((c) => [c.setId, c.count]))

        const results = publicSets.map((s) => {
          const cardCount = countMap.get(s.id) || 0
          return {
            id: s.id,
            userId: s.userId,
            title: s.title,
            description: s.description,
            subject: s.subject,
            cover: s.cover,
            cardCount,
            updatedAt: s.updatedAt,
          }
        })

        return new Response(JSON.stringify({ sets: results }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
        })
      },
    },
  },
})
