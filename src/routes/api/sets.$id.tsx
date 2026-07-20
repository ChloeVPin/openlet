import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../lib/db'
import {
  sets as setsTable,
  cards,
  folderSets,
  folders,
  classSets,
  classUsers,
  cardMetadata,
} from '../../../lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { createClient } from '../../lib/supabase/server'
import { checkRateLimit } from '../../../lib/db/rate-limit'

export const Route = createFileRoute('/api/sets/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params
        const { supabase, flushCookies } = createClient()
        const {
          data: { user: payload },
        } = await supabase.auth.getUser()
        flushCookies()

        // Rate limit based on user or IP for public sets
        const rateKey = payload?.id ?? `sets-ip:${id}`
        const allowed = await checkRateLimit(`sets-get:${rateKey}`, 60, 60_000)
        if (!allowed) {
          return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [set] = await db.select().from(setsTable).where(eq(setsTable.id, id)).limit(1)
        if (!set)
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })

        // Private sets: require auth + ownership
        if (set.visibility !== 'public') {
          if (!payload || payload.id !== set.userId) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }

        let cardList: any[] = []
        if (payload) {
          cardList = await db
            .select({
              id: cards.id,
              term: cards.term,
              definition: cards.definition,
              position: cards.position,
              isStarred: cardMetadata.isStarred,
            })
            .from(cards)
            .leftJoin(
              cardMetadata,
              and(eq(cards.id, cardMetadata.cardId), eq(cardMetadata.userId, payload.id))
            )
            .where(eq(cards.setId, id))
            .orderBy(cards.position)
          cardList = cardList.map(c => ({ ...c, isStarred: !!c.isStarred }))
        } else {
          cardList = await db
            .select()
            .from(cards)
            .where(eq(cards.setId, id))
            .orderBy(cards.position)
        }

        const folderLinks = payload
          ? await db
              .select({ folderId: folderSets.folderId })
              .from(folderSets)
              .innerJoin(folders, eq(folderSets.folderId, folders.id))
              .where(and(eq(folderSets.setId, id), eq(folders.userId, payload.id)))
          : []
        const classLinks = payload
          ? await db
              .select({ classId: classSets.classId })
              .from(classSets)
              .innerJoin(classUsers, eq(classSets.classId, classUsers.classId))
              .where(and(eq(classSets.setId, id), eq(classUsers.userId, payload.id)))
          : []

        return new Response(
          JSON.stringify({
            set,
            cards: cardList,
            folderIds: folderLinks.map((link) => link.folderId),
            classIds: classLinks.map((link) => link.classId),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
