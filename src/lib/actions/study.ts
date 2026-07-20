import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../../lib/db'
import { studySessions } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const SaveStudySessionSchema = z.object({
  setId: z.string().min(1),
  mode: z.string().min(1),
  correct: z.number().int().min(0),
  total: z.number().int().min(0),
})

export const saveStudySession = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => SaveStudySessionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId, mode, correct, total } = data
    await db.insert(studySessions).values({
      id: crypto.randomUUID(),
      userId: context.user.id,
      setId,
      mode,
      correctCards: correct,
      totalCards: total,
      score: total > 0 ? correct / total : 0,
    })

    return { ok: true }
  })

const ToggleCardStarSchema = z.object({
  cardId: z.string().min(1),
  setId: z.string().min(1),
  isStarred: z.boolean(),
})

export const toggleCardStar = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => ToggleCardStarSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { cardId, setId, isStarred } = data
    const { cardMetadata } = await import('../../../lib/db/schema')

    await db
      .insert(cardMetadata)
      .values({
        cardId,
        setId,
        userId: context.user.id,
        isStarred,
      })
      .onConflictDoUpdate({
        target: cardMetadata.cardId,
        set: { isStarred },
      })

    return { ok: true }
  })
