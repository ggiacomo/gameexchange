import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, userWishlist, games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { WishlistClient } from '@/components/library/wishlist-client'
import type { WishlistItemWithGame } from '@/types/database'

export const metadata = { title: 'My Wishlist — Gamexchange' }

export default async function WishlistPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const items = await db
    .select()
    .from(userWishlist)
    .innerJoin(games, eq(userWishlist.gameId, games.id))
    .where(eq(userWishlist.userId, user.id))
    .orderBy(userWishlist.createdAt)

  const mapped: WishlistItemWithGame[] = items.map(({ user_wishlist: wi, games: g }) => ({
    id: wi.id,
    user_id: wi.userId,
    game_id: wi.gameId,
    platform_preference: wi.platformPreference,
    created_at: wi.createdAt.toISOString(),
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
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">My Wishlist</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {mapped.length}
          {profile?.plan === 'free' ? '/10' : ''} games
        </p>
      </div>
      <WishlistClient items={mapped} plan={profile?.plan ?? 'free'} />
    </div>
  )
}
