import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../lib/db'
import { sets, cards } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const SetIdSchema = z.object({
  setId: z.string().min(1),
})

export const getSetForSharing = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => SetIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId } = data
    const [set] = await db.select().from(sets).where(eq(sets.id, setId)).limit(1)
    if (!set) return null
    if (set.userId !== context.user.id && set.visibility !== 'public') {
      throw new Error('Unauthorized')
    }
    const cardList = await db
      .select()
      .from(cards)
      .where(eq(cards.setId, setId))
      .orderBy(cards.position)
    return { ...set, cards: cardList }
  })

export const importSharedSet = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => SetIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId } = data
    const [original] = await db.select().from(sets).where(eq(sets.id, setId)).limit(1)
    if (!original) throw new Error('Set not found')
    if (original.userId !== context.user.id && original.visibility !== 'public') {
      throw new Error('Unauthorized')
    }

    const originalCards = await db
      .select()
      .from(cards)
      .where(eq(cards.setId, setId))
      .orderBy(cards.position)

    const newId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(sets).values({
        id: newId,
        userId: context.user.id,
        title: `${original.title} (copy)`,
        description: original.description || '',
        subject: original.subject || '',
      })
      for (let i = 0; i < originalCards.length; i++) {
        const card = originalCards[i]
        await tx.insert(cards).values({
          id: crypto.randomUUID(),
          setId: newId,
          term: card.term,
          definition: card.definition,
          position: i,
        })
      }
    })

    return { id: newId }
  })
