import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userLibrary, userWishlist, games, users } from '@/lib/db/schema'
import { eq, inArray, or, ne } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LibraryItemWithGameAndUser } from '@/types/database'

export const metadata = { title: 'Feed — Gamexchange' }

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (!user) return null

  // Recent available games
  const recentRows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(userLibrary.createdAt)
    .limit(12)

  const recentGames: LibraryItemWithGameAndUser[] = recentRows.map(({ user_library: li, games: g, users: u }) => ({
    id: li.id, user_id: li.userId, game_id: li.gameId,
    status: li.status as LibraryItemWithGameAndUser['status'],
    min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
    condition: li.condition as LibraryItemWithGameAndUser['condition'],
    notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
    games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country, email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null, rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended, created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString() },
  }))

  // Wishlist matches
  const wishlistRows = await db
    .select({ gameId: userWishlist.gameId })
    .from(userWishlist)
    .where(eq(userWishlist.userId, user.id))

  const wishlistGameIds = wishlistRows.map((w) => w.gameId)

  let wishlistMatches: LibraryItemWithGameAndUser[] = []
  if (wishlistGameIds.length > 0) {
    const matchRows = await db
      .select()
      .from(userLibrary)
      .innerJoin(games, eq(userLibrary.gameId, games.id))
      .innerJoin(users, eq(userLibrary.userId, users.id))
      .where(
        inArray(userLibrary.gameId, wishlistGameIds)
      )
      .limit(6)

    wishlistMatches = matchRows
      .filter((r) => r.user_library.userId !== user.id)
      .map(({ user_library: li, games: g, users: u }) => ({
        id: li.id, user_id: li.userId, game_id: li.gameId,
        status: li.status as LibraryItemWithGameAndUser['status'],
        min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
        condition: li.condition as LibraryItemWithGameAndUser['condition'],
        notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
        games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
        users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country, email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null, rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended, created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString() },
      }))
  }

  return (
    <div className="space-y-10">
      {params.welcome === '1' && (
        <div className="rounded-2xl bg-[#1a1a1a] p-6 text-white">
          <h2 className="text-xl font-extrabold mb-1 tracking-tight">Welcome to Gamexchange!</h2>
          <p className="text-white/70 text-sm">
            {wishlistMatches.length > 0
              ? `We found ${wishlistMatches.length} game${wishlistMatches.length > 1 ? 's' : ''} from your wishlist available to swap!`
              : "Start by adding games to your library or browse what's available near you."}
          </p>
        </div>
      )}

      {wishlistMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">From your wishlist</h2>
            <Link href="/wishlist" className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
              View wishlist <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <GameGrid items={wishlistMatches} currentUserId={user.id} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">Recently available</h2>
          <Link href="/browse" className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentGames.length > 0 ? (
          <GameGrid items={recentGames} currentUserId={user.id} />
        ) : (
          <div className="rounded-2xl bg-white shadow-sm p-12 text-center">
            <Gamepad2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No games available yet.</p>
            <Link href="/library">
              <Button className="mt-4" size="sm">Add your games</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function GameGrid({ items, currentUserId }: { items: LibraryItemWithGameAndUser[]; currentUserId: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.filter((item) => item.user_id !== currentUserId).map((item) => (
        <GameCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function GameCard({ item }: { item: LibraryItemWithGameAndUser }) {
  const game = item.games
  const owner = item.users
  return (
    <Link
      href={`/games/${game.igdb_slug ?? game.id}`}
      className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-[3/4] bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-300" sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gamepad2 className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {item.status === 'with_compensation' && item.min_compensation && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">+€{item.min_compensation.toFixed(0)}</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-[#1a1a1a] leading-tight line-clamp-2 mb-1">{game.title}</p>
        <p className="text-[11px] text-gray-400">@{owner.username} · {owner.city}</p>
      </div>
    </Link>
  )
}
