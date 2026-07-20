import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { sets, cards, cardMetadata, studySessions } from '../../../lib/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/dashboard')({
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

        // Rate limit: max 30 dashboard loads per minute per user
        const allowed = await checkRateLimit(`dashboard:${payload.id}`, 30, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const userSets = await db
          .select()
          .from(sets)
          .where(eq(sets.userId, payload.id))
          .orderBy(desc(sets.updatedAt))

        const setIds = userSets.map((s) => s.id)

        const cardCounts = await db
          .select({
            setId: cards.setId,
            count: sql<number>`count(*)::int`,
          })
          .from(cards)
          .where(inArray(cards.setId, setIds))
          .groupBy(cards.setId)

        const countMap = new Map(cardCounts.map((c) => [c.setId, c.count]))

        const allCards = await db
          .select({ id: cards.id, setId: cards.setId })
          .from(cards)
          .where(inArray(cards.setId, setIds))

        const meta = await db
          .select()
          .from(cardMetadata)
          .where(and(eq(cardMetadata.userId, payload.id), inArray(cardMetadata.setId, setIds)))

        const metaByCard = new Map(meta.map((m) => [m.cardId, m]))
        const dueBySet = new Map<string, number>()
        const now = Date.now()

        for (const card of allCards) {
          const m = metaByCard.get(card.id)
          let due = true
          if (m && m.lastReview && m.reps > 0) {
            const last = new Date(m.lastReview).getTime()
            const dueAt = last + (m.scheduledDays || 0) * 24 * 60 * 60 * 1000
            due = now >= dueAt
          }
          if (due) {
            dueBySet.set(card.setId, (dueBySet.get(card.setId) || 0) + 1)
          }
        }

        const sessions = await db
          .select({
            setId: studySessions.setId,
            lastAt: sql<string>`max(${studySessions.createdAt})`,
          })
          .from(studySessions)
          .where(eq(studySessions.userId, payload.id))
          .groupBy(studySessions.setId)

        const lastMap = new Map(sessions.map((s) => [s.setId, s.lastAt]))

        let totalDue = 0
        const results = userSets.map((s) => {
          const cardCount = countMap.get(s.id) || 0
          const dueCount = dueBySet.get(s.id) || 0
          totalDue += dueCount
          return {
            id: s.id,
            title: s.title,
            description: s.description,
            subject: s.subject,
            cover: s.cover,
            cardCount,
            dueCount,
            lastStudied: lastMap.get(s.id) || null,
            updatedAt: s.updatedAt,
          }
        })

        const userFolders = await db.execute(sql`
          SELECT f.id, f.name, f.description, COUNT(fs.set_id)::int as set_count
          FROM folders f
          LEFT JOIN folder_sets fs ON f.id = fs.folder_id
          WHERE f.user_id = ${payload.id}
          GROUP BY f.id
          ORDER BY f.updated_at DESC
        `)

        const userClasses = await db.execute(sql`
          SELECT c.id, c.name, c.school, COUNT(cs.set_id)::int as set_count
          FROM classes c
          INNER JOIN class_users cu ON c.id = cu.class_id
          LEFT JOIN class_sets cs ON c.id = cs.class_id
          WHERE cu.user_id = ${payload.id}
          GROUP BY c.id
          ORDER BY MAX(cu.joined_at) DESC
        `)

        return new Response(
          JSON.stringify({ sets: results, totalDue, folders: userFolders, classes: userClasses }),
          {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
          },
        )
      },
    },
  },
})
