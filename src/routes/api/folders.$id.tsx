import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { folders } from '../../../lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/folders/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
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

        const allowed = await checkRateLimit(`folder:${payload.id}:${params.id}`, 30, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [folder] = await db
          .select()
          .from(folders)
          .where(and(eq(folders.id, params.id), eq(folders.userId, payload.id)))
          .limit(1)

        if (!folder) {
          return new Response(JSON.stringify({ error: 'Folder not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const folderSetsData = await db.execute(sql`
          SELECT s.id, s.title, s.description, s.subject, s.cover, s.updated_at as "updatedAt",
                 COUNT(c.id)::int as "cardCount"
          FROM sets s
          INNER JOIN folder_sets fs ON s.id = fs.set_id
          LEFT JOIN cards c ON s.id = c.set_id
          WHERE fs.folder_id = ${params.id}
          GROUP BY s.id
          ORDER BY s.updated_at DESC
        `)

        return new Response(JSON.stringify({ folder, sets: folderSetsData }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
        })
      },
    },
  },
})
