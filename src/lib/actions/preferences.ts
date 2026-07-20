import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../lib/db'
import { profiles, type UserPreferences } from '../../../lib/db/schema'
import { authMiddleware } from '../auth/actions'

const emptyPrefs: UserPreferences = {}

export const getPreferences = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const [row] = await db
      .select({ preferences: profiles.preferences })
      .from(profiles)
      .where(eq(profiles.id, context.user.id))
      .limit(1)
    return (row?.preferences ?? emptyPrefs) as UserPreferences
  })

/**
 * Validates a cover value which may include an optional |icon suffix.
 * Valid: preset IDs, solid:#RRGGBB, and either can have |icon appended.
 */
const CoverValue = z
  .string()
  .min(1)
  .max(64)
  .refine((v) => {
    // Strip optional |icon suffix for validation
    const pipeIdx = v.indexOf('|')
    const base = pipeIdx === -1 ? v : v.slice(0, pipeIdx)
    const iconPart = pipeIdx === -1 ? '' : v.slice(pipeIdx + 1)
    // Base must be valid: preset or solid color
    const validBase =
      base === 'default' ||
      /^(blue|sky|mint|amber|rose|lavender|slate|night)$/.test(base) ||
      /^solid:#[0-9a-fA-F]{6}$/.test(base)
    // Icon part is optional but if present must be non-empty alphanumeric+dashes
    const validIcon = !iconPart || /^[a-z][a-z0-9-]*$/.test(iconPart)
    return validBase && validIcon
  }, 'Invalid cover')

const UpdatePreferencesSchema = z.object({
  defaultCover: CoverValue.optional(),
  lastCover: CoverValue.optional(),
})

/**
 * Shallow-merge account preferences on profiles.preferences.
 * Only keys present in the payload are updated.
 */
export const updatePreferences = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => UpdatePreferencesSchema.parse(data))
  .handler(async ({ data, context }) => {
    const patch: UserPreferences = {}
    if (data.defaultCover !== undefined) patch.defaultCover = data.defaultCover
    if (data.lastCover !== undefined) patch.lastCover = data.lastCover

    if (Object.keys(patch).length === 0) {
      const [row] = await db
        .select({ preferences: profiles.preferences })
        .from(profiles)
        .where(eq(profiles.id, context.user.id))
        .limit(1)
      return (row?.preferences ?? emptyPrefs) as UserPreferences
    }

    // Postgres jsonb || merges top-level keys
    await db
      .update(profiles)
      .set({
        preferences: sql`coalesce(${profiles.preferences}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
      })
      .where(eq(profiles.id, context.user.id))

    const [row] = await db
      .select({ preferences: profiles.preferences })
      .from(profiles)
      .where(eq(profiles.id, context.user.id))
      .limit(1)

    return (row?.preferences ?? emptyPrefs) as UserPreferences
  })
