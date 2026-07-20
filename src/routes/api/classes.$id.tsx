import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import { classes, classUsers, profiles } from '../../../lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/classes/$id')({
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

        const allowed = await checkRateLimit(`class:${payload.id}:${params.id}`, 30, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [classRecord] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, params.id))
          .limit(1)
        if (!classRecord) {
          return new Response(JSON.stringify({ error: 'Class not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [membership] = await db
          .select({ role: classUsers.role })
          .from(classUsers)
          .where(and(eq(classUsers.classId, params.id), eq(classUsers.userId, payload.id)))
          .limit(1)

        if (!membership && classRecord.visibility !== 'public') {
          return new Response(JSON.stringify({ error: 'Class not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const classData = {
          id: classRecord.id,
          name: classRecord.name,
          description: classRecord.description,
          school: classRecord.school,
          visibility: classRecord.visibility,
          role: membership?.role ?? null,
          isOwner: classRecord.userId === payload.id,
        }

        const classSetsData = await db.execute(sql`
          SELECT s.id, s.title, s.description, s.subject, s.cover, s.updated_at as "updatedAt",
                 COUNT(c.id)::int as "cardCount"
          FROM sets s
          INNER JOIN class_sets cs ON s.id = cs.set_id
          LEFT JOIN cards c ON s.id = c.set_id
          WHERE cs.class_id = ${params.id}
          GROUP BY s.id
          ORDER BY s.updated_at DESC
        `)

        const members = membership
          ? await db
              .select({ id: profiles.id, name: profiles.name, role: classUsers.role })
              .from(classUsers)
              .innerJoin(profiles, eq(classUsers.userId, profiles.id))
              .where(eq(classUsers.classId, params.id))
              .orderBy(classUsers.joinedAt)
          : []

        return new Response(JSON.stringify({ classData, sets: classSetsData, members }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private' },
        })
      },
    },
  },
})
