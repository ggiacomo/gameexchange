import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// --------------- App tables ---------------

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(), // matches Neon Auth user id
    username: text('username').notNull().unique(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    city: text('city').notNull().default(''),
    country: text('country').notNull().default(''),
    emailConfirmed: boolean('email_confirmed').notNull().default(false),
    plan: text('plan').notNull().default('free'),
    planExpiresAt: timestamp('plan_expires_at'),
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).notNull().default('0'),
    swapsCompleted: integer('swaps_completed').notNull().default(0),
    isSuspended: boolean('is_suspended').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_username_idx').on(t.username)]
)

export const games = pgTable('games', {
  id: integer('id').primaryKey(), // IGDB id
  title: text('title').notNull(),
  coverUrl: text('cover_url'),
  platforms: text('platforms').array(),
  genres: text('genres').array(),
  releaseYear: integer('release_year'),
  igdbSlug: text('igdb_slug'),
})

export const userLibrary = pgTable(
  'user_library',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id),
    status: text('status').notNull().default('private'), // private | available | with_compensation
    minCompensation: numeric('min_compensation', { precision: 8, scale: 2 }),
    condition: text('condition').notNull().default('good'), // mint | good | fair
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_library_user_game_idx').on(t.userId, t.gameId),
    index('user_library_user_idx').on(t.userId),
  ]
)

export const userWishlist = pgTable(
  'user_wishlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id),
    platformPreference: text('platform_preference'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('user_wishlist_user_game_idx').on(t.userId, t.gameId)]
)

export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proposerId: text('proposer_id')
      .notNull()
      .references(() => users.id),
    receiverId: text('receiver_id')
      .notNull()
      .references(() => users.id),
    requestedItemId: uuid('requested_item_id')
      .notNull()
      .references(() => userLibrary.id),
    status: text('status').notNull().default('pending'),
    message: text('message'),
    expiresAt: timestamp('expires_at').notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('proposals_proposer_idx').on(t.proposerId),
    index('proposals_receiver_idx').on(t.receiverId),
    index('proposals_status_idx').on(t.status),
  ]
)

export const proposalItems = pgTable('proposal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  libraryItemId: uuid('library_item_id')
    .notNull()
    .references(() => userLibrary.id),
  compensationAmount: numeric('compensation_amount', { precision: 8, scale: 2 }).notNull().default('0'),
  offeredBy: text('offered_by').notNull(), // proposer | receiver
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('messages_proposal_idx').on(t.proposalId)]
)

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .notNull()
    .references(() => proposals.id),
  reviewerId: text('reviewer_id')
    .notNull()
    .references(() => users.id),
  revieweeId: text('reviewee_id')
    .notNull()
    .references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId),
    index('notifications_read_idx').on(t.readAt),
  ]
)
