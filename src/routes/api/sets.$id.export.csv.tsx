import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { sets as setsTable, cards } from '../../../lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { exportToCSV } from '../../../lib/importers/parsers'
import { createClient } from '../../lib/supabase/server'

export const Route = createFileRoute('/api/sets/$id/export/csv')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabase, flushCookies } = createClient()
        const {
          data: { user: payload },
        } = await supabase.auth.getUser()
        flushCookies()
        if (!payload) return new Response('Unauthorized', { status: 401 })

        const { id } = params
        const [set] = await db
          .select()
          .from(setsTable)
          .where(and(eq(setsTable.id, id), eq(setsTable.userId, payload.id)))
          .limit(1)
        if (!set) return new Response('Not found', { status: 404 })

        const cardList = await db
          .select()
          .from(cards)
          .where(eq(cards.setId, id))
          .orderBy(cards.position)

        const csv = exportToCSV(cardList.map((c) => ({ term: c.term, definition: c.definition })))
        const filename = set.title.replace(/[^a-zA-Z0-9]/g, '_')
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        })
      },
    },
  },
})
