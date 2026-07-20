import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../../../lib/db'
import { classes, classUsers, classSets, sets } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const CreateClassSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  school: z.string().max(200).default(''),
  visibility: z.enum(['private', 'public']).default('private'),
})

export const createClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => CreateClassSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { name, description, school, visibility } = data
    const userId = context.user.id
    const id = crypto.randomUUID()

    await db.transaction(async (tx) => {
      await tx.insert(classes).values({
        id,
        userId,
        name,
        description,
        school,
        visibility,
      })
      await tx.insert(classUsers).values({
        classId: id,
        userId,
        role: 'admin',
      })
    })

    return { id }
  })

const UpdateClassSchema = z.object({
  classId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  school: z.string().max(200).optional(),
  visibility: z.enum(['private', 'public']).optional(),
})

export const updateClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdateClassSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId, name, description, school, visibility } = data
    const userId = context.user.id

    // Must be admin
    const [existingUser] = await db
      .select()
      .from(classUsers)
      .where(
        and(
          eq(classUsers.classId, classId),
          eq(classUsers.userId, userId),
          eq(classUsers.role, 'admin'),
        ),
      )
      .limit(1)
    if (!existingUser) throw new Error('Not authorized')

    await db
      .update(classes)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(school !== undefined ? { school } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        updatedAt: new Date(),
      })
      .where(eq(classes.id, classId))

    return { ok: true }
  })

const DeleteClassSchema = z.object({
  classId: z.string().min(1),
})

export const deleteClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => DeleteClassSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId } = data
    const userId = context.user.id

    const [existing] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.userId, userId)))
      .limit(1)
    if (!existing) throw new Error('Not found')

    await db.delete(classes).where(eq(classes.id, classId))
    return { ok: true }
  })

const ClassSetSchema = z.object({
  classId: z.string().min(1),
  setId: z.string().min(1),
})

export const addSetToClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => ClassSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId, setId } = data
    const userId = context.user.id

    const [existingUser] = await db
      .select()
      .from(classUsers)
      .where(and(eq(classUsers.classId, classId), eq(classUsers.userId, userId)))
      .limit(1)
    if (!existingUser || existingUser.role !== 'admin') throw new Error('Not authorized')

    const [set] = await db
      .select({ id: sets.id })
      .from(sets)
      .where(and(eq(sets.id, setId), eq(sets.userId, userId)))
      .limit(1)
    if (!set) throw new Error('Set not found')

    await db
      .insert(classSets)
      .values({
        classId,
        setId,
      })
      .onConflictDoNothing()

    return { ok: true }
  })

export const removeSetFromClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => ClassSetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId, setId } = data
    const userId = context.user.id

    const [existingUser] = await db
      .select()
      .from(classUsers)
      .where(
        and(
          eq(classUsers.classId, classId),
          eq(classUsers.userId, userId),
          eq(classUsers.role, 'admin'),
        ),
      )
      .limit(1)
    if (!existingUser) throw new Error('Not authorized')

    await db
      .delete(classSets)
      .where(and(eq(classSets.classId, classId), eq(classSets.setId, setId)))

    return { ok: true }
  })

const JoinClassSchema = z.object({
  classId: z.string().min(1),
})

export const joinClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => JoinClassSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId } = data
    const userId = context.user.id

    const [existingClass] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1)
    if (!existingClass) throw new Error('Not found')
    if (existingClass.visibility === 'private')
      throw new Error('Cannot join private class directly')

    await db
      .insert(classUsers)
      .values({
        classId,
        userId,
        role: 'member',
      })
      .onConflictDoNothing()

    return { ok: true }
  })

const LeaveClassSchema = z.object({
  classId: z.string().min(1),
})

export const leaveClass = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => LeaveClassSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { classId } = data

    const [membership] = await db
      .select({ role: classUsers.role })
      .from(classUsers)
      .where(and(eq(classUsers.classId, classId), eq(classUsers.userId, context.user.id)))
      .limit(1)
    if (!membership) throw new Error('Not a class member')
    if (membership.role === 'admin') throw new Error('Class admins cannot leave their class')

    await db
      .delete(classUsers)
      .where(and(eq(classUsers.classId, classId), eq(classUsers.userId, context.user.id)))
    return { ok: true }
  })
