import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  index,
  boolean,
} from 'drizzle-orm/pg-core'

/** Account-level prefs stored on profiles.preferences (JSONB). */
export type UserPreferences = {
  /** Default cover for newly created sets */
  defaultCover?: string
  /** Last cover the user picked (handy for "use again") */
  lastCover?: string
}

/**
 * Public profiles table linked to auth.users.
 * Supabase Auth manages the actual user in auth.users;
 * this table stores app-level data (name, preferences).
 * All FK references point here rather than to auth.users directly.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().default(''),
    /** Account prefs JSON - default cover, last cover, etc. */
    preferences: jsonb('preferences').$type<UserPreferences>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('profiles_id_idx').on(t.id)],
)

export const sets = pgTable(
  'sets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').default(''),
    subject: text('subject').default(''),
    /** Per-set library cover: preset id or solid:#RRGGBB */
    cover: text('cover').default('default'),
    /** 'private' (owner only) or 'public' (anyone via /public/$id) */
    visibility: text('visibility').notNull().default('private'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sets_user_id_updated_at_idx').on(t.userId, t.updatedAt.desc())],
)

export const cards = pgTable(
  'cards',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cards_set_id_position_idx').on(t.setId, t.position)],
)

export const studySessions = pgTable(
  'study_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull().default('flashcard'),
    score: doublePrecision('score').default(0),
    totalCards: integer('total_cards').default(0),
    correctCards: integer('correct_cards').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('study_sessions_user_id_created_at_idx').on(t.userId, t.createdAt.desc()),
    index('study_sessions_set_id_idx').on(t.setId),
  ],
)

export const cardMetadata = pgTable(
  'card_metadata',
  {
    cardId: text('card_id')
      .primaryKey()
      .references(() => cards.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    stability: doublePrecision('stability').notNull().default(0),
    difficulty: doublePrecision('difficulty').notNull().default(0),
    elapsedDays: doublePrecision('elapsed_days').notNull().default(0),
    scheduledDays: doublePrecision('scheduled_days').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    lastReview: timestamp('last_review', { withTimezone: true }),
    isStarred: boolean('is_starred').notNull().default(false),
  },
  (t) => [
    index('card_metadata_user_id_set_id_idx').on(t.userId, t.setId),
    index('card_metadata_user_id_last_review_idx').on(t.userId, t.lastReview),
  ],
)

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
})

/** @deprecated Use `profiles` instead. Kept for migration - will be removed after data is moved. */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  preferences: jsonb('preferences').$type<UserPreferences>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const folders = pgTable(
  'folders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default(''),
    visibility: text('visibility').notNull().default('private'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('folders_user_id_updated_at_idx').on(t.userId, t.updatedAt.desc())],
)

export const classes = pgTable(
  'classes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default(''),
    school: text('school').default(''),
    visibility: text('visibility').notNull().default('private'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('classes_user_id_updated_at_idx').on(t.userId, t.updatedAt.desc())],
)

export const folderSets = pgTable(
  'folder_sets',
  {
    folderId: text('folder_id')
      .notNull()
      .references(() => folders.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('folder_sets_folder_id_idx').on(t.folderId)],
)

export const classUsers = pgTable(
  'class_users',
  {
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('class_users_class_id_idx').on(t.classId),
    index('class_users_user_id_idx').on(t.userId),
  ],
)

export const classSets = pgTable(
  'class_sets',
  {
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('class_sets_class_id_idx').on(t.classId)],
)
