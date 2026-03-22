import { redirect, notFound } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { NewProposalClient } from '@/components/proposals/new-proposal-client'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, userLibrary, games } from '@/lib/db/schema'
import type { LibraryItemWithGame, UserRow } from '@/types/database'

export const metadata = { title: 'Nuova proposta — Gamexchange' }

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ libraryItemId?: string; receiverId?: string }>
}) {
  const params = await searchParams
  if (!params.libraryItemId || !params.receiverId) notFound()

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Can't propose to yourself
  if (params.receiverId === user.id) redirect('/library')

  // Fetch the requested item
  const [requestedRow] = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.id, params.libraryItemId))

  if (
    !requestedRow ||
    requestedRow.user_library.userId !== params.receiverId ||
    !['available', 'with_compensation'].includes(requestedRow.user_library.status)
  ) {
    notFound()
  }

  // Fetch receiver profile
  const [receiverRow] = await db.select().from(users).where(eq(users.id, params.receiverId))
  if (!receiverRow) notFound()

  // Fetch proposer's available library items
  const myLibraryRows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(
      eq(userLibrary.userId, user.id)
    )
    .then((rows) =>
      rows.filter((r) => ['available', 'with_compensation'].includes(r.user_library.status))
    )

  const mapItem = (row: { user_library: typeof userLibrary.$inferSelect; games: typeof games.$inferSelect }): LibraryItemWithGame => ({
    id: row.user_library.id,
    user_id: row.user_library.userId,
    game_id: row.user_library.gameId,
    status: row.user_library.status as LibraryItemWithGame['status'],
    min_compensation: row.user_library.minCompensation ? Number(row.user_library.minCompensation) : null,
    condition: row.user_library.condition as LibraryItemWithGame['condition'],
    notes: row.user_library.notes,
    created_at: row.user_library.createdAt.toISOString(),
    updated_at: row.user_library.updatedAt.toISOString(),
    games: {
      id: row.games.id,
      title: row.games.title,
      cover_url: row.games.coverUrl,
      platforms: row.games.platforms ?? [],
      genres: row.games.genres ?? [],
      release_year: row.games.releaseYear,
      igdb_slug: row.games.igdbSlug,
    },
  })

  const receiver: UserRow = {
    id: receiverRow.id,
    username: receiverRow.username,
    avatar_url: receiverRow.avatarUrl,
    bio: receiverRow.bio,
    city: receiverRow.city,
    country: receiverRow.country,
    email_confirmed: receiverRow.emailConfirmed,
    plan: receiverRow.plan as 'free' | 'pro',
    plan_expires_at: receiverRow.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(receiverRow.ratingAvg),
    swaps_completed: receiverRow.swapsCompleted,
    is_suspended: receiverRow.isSuspended,
    created_at: receiverRow.createdAt.toISOString(),
    updated_at: receiverRow.updatedAt.toISOString(),
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Proponi uno scambio</h1>
      <NewProposalClient
        requestedItem={mapItem(requestedRow)}
        receiver={receiver}
        myLibrary={myLibraryRows.map(mapItem)}
        proposerId={user.id}
      />
    </div>
  )
}
