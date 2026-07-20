import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { cardMetadata, studySessions, cards } from '../../../lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/analytics')({
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

        const allowed = await checkRateLimit(`analytics:${payload.id}`, 30, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // 1. Heatmap data: Count study sessions per day for the last year
        const heatmapQuery = await db.execute(sql`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as count
          FROM ${studySessions}
          WHERE user_id = ${payload.id}
            AND created_at >= NOW() - INTERVAL '365 days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `)

        const heatmap = heatmapQuery.map((row: any) => {
          let dateStr = ''
          if (row.date instanceof Date) {
            dateStr = row.date.toISOString().split('T')[0]
          } else if (typeof row.date === 'string') {
            dateStr = row.date.split('T')[0]
          } else {
            dateStr = String(row.date || '')
          }
          return {
            date: dateStr,
            count: Number(row.count),
          }
        })

        // 2. Weakest cards (lowest stability, highest reps)
        const weakestCardsQuery = await db
          .select({
            cardId: cardMetadata.cardId,
            term: cards.term,
            stability: cardMetadata.stability,
            reps: cardMetadata.reps,
            setId: cardMetadata.setId,
          })
          .from(cardMetadata)
          .innerJoin(cards, eq(cardMetadata.cardId, cards.id))
          .where(eq(cardMetadata.userId, payload.id))
          .orderBy(cardMetadata.stability)
          .limit(10)

        // 3. Retention overall: Average stability and total reps across all cards
        const overallQuery = await db.execute(sql`
          SELECT
            AVG(stability) as avg_stability,
            SUM(reps) as total_reps,
            SUM(lapses) as total_lapses
          FROM ${cardMetadata}
          WHERE user_id = ${payload.id}
        `)

        const overall = overallQuery[0] || { avg_stability: 0, total_reps: 0, total_lapses: 0 }

        return new Response(
          JSON.stringify({
            heatmap,
            weakestCards: weakestCardsQuery,
            overall: {
              avgStability: Number(overall.avg_stability || 0),
              totalReps: Number(overall.total_reps || 0),
              totalLapses: Number(overall.total_lapses || 0),
            },
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
          },
        )
      },
    },
  },
})
