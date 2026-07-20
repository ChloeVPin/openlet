import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { sets } from '../../../lib/db/schema'
import { and, ilike, desc, eq } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/sets/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const q = url.searchParams.get('q') || ''
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 200)
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

        const { supabase, flushCookies } = createClient()
        const {
          data: { user: payload },
        } = await supabase.auth.getUser()
        flushCookies()
        if (!payload)
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })

        // Rate limit: max 60 searches per minute per user
        const allowed = await checkRateLimit(`sets-search:${payload.id}`, 60, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const conditions = [eq(sets.userId, payload.id)]
        const qTrimmed = q.trim()
        if (qTrimmed.length >= 2) {
          conditions.push(ilike(sets.title, `%${qTrimmed}%`))
        }

        if (conditions.length === 0)
          return new Response(JSON.stringify({ results: [] }), {
            headers: { 'Content-Type': 'application/json' },
          })

        const results = await db
          .select()
          .from(sets)
          .where(and(...conditions))
          .orderBy(desc(sets.updatedAt))
          .limit(limit)
          .offset(offset)

        return new Response(JSON.stringify({ results, total: results.length }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
