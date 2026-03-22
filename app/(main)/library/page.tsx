import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, userLibrary, games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { LibraryClient } from '@/components/library/library-client'
import type { LibraryItemWithGame } from '@/types/database'

export const metadata = { title: 'La mia libreria — Gamexchange' }

export default async function LibraryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const items = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.userId, user.id))
    .orderBy(userLibrary.createdAt)

  const mapped: LibraryItemWithGame[] = items.map(({ user_library: li, games: g }) => ({
    id: li.id,
    user_id: li.userId,
    game_id: li.gameId,
    status: li.status as LibraryItemWithGame['status'],
    min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
    condition: li.condition as LibraryItemWithGame['condition'],
    notes: li.notes,
    created_at: li.createdAt.toISOString(),
    updated_at: li.updatedAt.toISOString(),
    games: {
      id: g.id,
      title: g.title,
      cover_url: g.coverUrl,
      platforms: g.platforms ?? null,
      genres: g.genres ?? null,
      release_year: g.releaseYear,
      igdb_slug: g.igdbSlug,
    },
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">La mia libreria</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {mapped.length}
            {profile?.plan === 'free' ? '/50' : ''} giochi
          </p>
        </div>
      </div>
      <LibraryClient items={mapped} plan={profile?.plan ?? 'free'} />
    </div>
  )
}
