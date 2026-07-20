import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { db } from '../../../lib/db'
import { cardMetadata, cards } from '../../../lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

const MetadataSchema = z.object({
  cardId: z.string().min(1),
  setId: z.string().min(1),
  stability: z.number().min(0).max(36500).default(0),
  difficulty: z.number().min(0).max(10).default(0),
  elapsedDays: z.number().min(0).max(36500).default(0),
  scheduledDays: z.number().min(0).max(36500).default(0),
  reps: z.number().int().min(0).max(999999).default(0),
  lapses: z.number().int().min(0).max(999999).default(0),
  lastReview: z.string().nullable().optional(),
})

export const Route = createFileRoute('/api/card-metadata')({
  server: {
    handlers: {
      GET: async ({ request }) => {
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

        const url = new URL(request.url)
        const setId = url.searchParams.get('setId')
        if (!setId)
          return new Response(JSON.stringify({ error: 'setId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })

        const [set] = await db
          .select()
          .from(cards)
          .where(and(eq(cards.setId, setId)))
          .limit(1)
        if (!set)
          return new Response(JSON.stringify({ metadata: [] }), {
            headers: { 'Content-Type': 'application/json' },
          })

        // Rate limit: max 60 GET requests per minute per user
        const allowed = await checkRateLimit(`card-meta-get:${payload.id}`, 60, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const metadata = await db
          .select()
          .from(cardMetadata)
          .where(and(eq(cardMetadata.setId, setId), eq(cardMetadata.userId, payload.id)))
        return new Response(JSON.stringify({ metadata }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
      POST: async ({ request }) => {
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

        const body = await request.json()
        const parsed = MetadataSchema.safeParse(body)
        if (!parsed.success)
          return new Response(
            JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )

        const {
          cardId,
          setId,
          stability,
          difficulty,
          elapsedDays,
          scheduledDays,
          reps,
          lapses,
          lastReview,
        } = parsed.data

        const [card] = await db
          .select()
          .from(cards)
          .where(and(eq(cards.id, cardId), eq(cards.setId, setId)))
          .limit(1)
        if (!card)
          return new Response(JSON.stringify({ error: 'Card not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })

        // Rate limit: max 120 POST requests per minute per user
        const allowed = await checkRateLimit(`card-meta-post:${payload.id}`, 120, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        await db
          .insert(cardMetadata)
          .values({
            cardId,
            userId: payload.id,
            setId,
            stability,
            difficulty,
            elapsedDays,
            scheduledDays,
            reps,
            lapses,
            lastReview: lastReview ? new Date(lastReview) : null,
          })
          .onConflictDoUpdate({
            target: cardMetadata.cardId,
            set: {
              stability,
              difficulty,
              elapsedDays,
              scheduledDays,
              reps,
              lapses,
              lastReview: lastReview ? new Date(lastReview) : null,
            },
          })

        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
