import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../../../lib/db'
import { folders, folderSets, sets } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  visibility: z.enum(['private', 'public']).default('private'),
})

export const createFolder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => CreateFolderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { name, description, visibility } = data
    const userId = context.user.id
    const id = crypto.randomUUID()

    await db.insert(folders).values({
      id,
      userId,
      name,
      description,
      visibility,
    })

    return { id }
  })

const UpdateFolderSchema = z.object({
  folderId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  visibility: z.enum(['private', 'public']).optional(),
})

export const updateFolder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdateFolderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { folderId, name, description, visibility } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db
      .update(folders)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId))

    return { ok: true }
  })

const DeleteFolderSchema = z.object({
  folderId: z.string().min(1),
})

export const deleteFolder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => DeleteFolderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { folderId } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db.delete(folders).where(eq(folders.id, folderId))
    return { ok: true }
  })

const FolderSetSchema = z.object({
  folderId: z.string().min(1),
  setId: z.string().min(1),
})

export const addSetToFolder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => FolderSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { folderId, setId } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Folder not found')

    const [set] = await db
      .select({ id: sets.id })
      .from(sets)
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))
      .limit(1)
    if (!set) throw new Error('Set not found')

    await db
      .insert(folderSets)
      .values({
        folderId,
        setId,
      })
      .onConflictDoNothing()

    return { ok: true }
  })

export const removeSetFromFolder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => FolderSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { folderId, setId } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Folder not found')

    await db
      .delete(folderSets)
      .where(and(eq(folderSets.folderId, folderId), eq(folderSets.setId, setId)))

    return { ok: true }
  })
