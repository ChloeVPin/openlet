import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../../../lib/db'
import { sets, cards } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const CardSchema = z.object({
  term: z.string().min(1).max(500),
  definition: z.string().max(2000).default(''),
})

const CreateSetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  subject: z.string().max(100).default(''),
  cover: z.string().max(64).optional(),
  cards: z.array(CardSchema).min(1),
})

export const createSet = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => CreateSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { title, description, subject, cover, cards: inputCards } = data
    const userId = context.user.id
    const id = crypto.randomUUID()

    await db.transaction(async (tx) => {
      await tx.insert(sets).values({
        id,
        userId,
        title,
        description,
        subject,
        ...(cover ? { cover } : {}),
      })
      for (let i = 0; i < inputCards.length; i++) {
        const card = inputCards[i]
        await tx.insert(cards).values({
          id: crypto.randomUUID(),
          setId: id,
          term: card.term,
          definition: card.definition,
          position: i,
        })
      }
    })

    return { id }
  })

const UpdateSetSchema = z.object({
  setId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  subject: z.string().max(100).default(''),
  cards: z.array(CardSchema).min(1),
})

export const updateSet = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdateSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId, title, description, subject, cards: inputCards } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(sets)
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db.transaction(async (tx) => {
      await tx
        .update(sets)
        .set({ title, description, subject, updatedAt: new Date() })
        .where(eq(sets.id, setId))
      await tx.delete(cards).where(eq(cards.setId, setId))
      for (let i = 0; i < inputCards.length; i++) {
        const card = inputCards[i]
        await tx.insert(cards).values({
          id: crypto.randomUUID(),
          setId,
          term: card.term,
          definition: card.definition,
          position: i,
        })
      }
    })

    return { ok: true }
  })

const DeleteSetSchema = z.object({
  setId: z.string().min(1),
})

export const deleteSet = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => DeleteSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(sets)
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db.delete(sets).where(eq(sets.id, setId))

    return { ok: true }
  })

const UpdateVisibilitySchema = z.object({
  setId: z.string().min(1),
  visibility: z.enum(['private', 'public']),
})

export const updateSetVisibility = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdateVisibilitySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId, visibility } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(sets)
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db.update(sets).set({ visibility, updatedAt: new Date() }).where(eq(sets.id, setId))

    return { ok: true }
  })

const UpdateCoverSchema = z.object({
  setId: z.string().min(1),
  /** cover|icon format e.g. "default|book-open" or "solid:#4255ff|brain" */
  cover: z.string().min(1).max(64),
})

export const updateSetCover = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdateCoverSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { setId, cover } = data
    const userId = context.user.id

    await db
      .update(sets)
      .set({ cover, updatedAt: new Date() })
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))

    return { ok: true }
  })
