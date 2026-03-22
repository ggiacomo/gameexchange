import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userLibrary, users, userWishlist, games as gamesTable } from '@/lib/db/schema'
import { eq, inArray, and, ne } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { getGameBySlug } from '@/lib/igdb/cache'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCondition } from '@/lib/utils/format'
import { ArrowRight, Gamepad2, Star } from 'lucide-react'
import type { LibraryItemWithGameAndUser, UserRow } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = await getGameBySlug(slug)
  return { title: game ? `${game.title} — Gamexchange` : 'Game — Gamexchange' }
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = await getGameBySlug(slug)
  if (!game) notFound()

  const currentUser = await getCurrentUser()

  const listingRows = await db
    .select()
    .from(userLibrary)
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(
      and(
        eq(userLibrary.gameId, game.id),
        inArray(userLibrary.status, ['available', 'with_compensation'])
      )
    )
    .orderBy(userLibrary.createdAt)
    .limit(20)

  const listings: LibraryItemWithGameAndUser[] = listingRows
    .filter((r) => r.user_library.userId !== (currentUser?.id ?? ''))
    .map(({ user_library: li, users: u }) => ({
      id: li.id, user_id: li.userId, game_id: li.gameId,
      status: li.status as LibraryItemWithGameAndUser['status'],
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition as LibraryItemWithGameAndUser['condition'],
      notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
      games: { id: game.id, title: game.title, cover_url: game.cover_url, platforms: game.platforms, genres: game.genres, release_year: game.release_year, igdb_slug: game.igdb_slug },
      users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country, email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null, rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended, created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString() },
    }))

  const wanterRows = await db
    .select()
    .from(userWishlist)
    .innerJoin(users, eq(userWishlist.userId, users.id))
    .where(eq(userWishlist.gameId, game.id))
    .limit(10)

  const wanters = wanterRows
    .filter((r) => r.user_wishlist.userId !== (currentUser?.id ?? ''))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6 mb-10">
        <div className="relative h-40 w-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-md">
          {game.cover_url ? (
            <Image src={game.cover_url} alt={game.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Gamepad2 className="h-10 w-10 text-gray-300" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{game.title}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            {game.platforms?.map((p) => <Badge key={p} variant="default">{p}</Badge>)}
            {game.genres?.slice(0, 3).map((g) => <Badge key={g} variant="info">{g}</Badge>)}
          </div>
          {game.release_year && <p className="text-sm text-gray-500">{game.release_year}</p>}
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available to swap ({listings.length})</h2>
        {!listings.length ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center">
            <p className="text-gray-500">No one is swapping this game right now.</p>
            <Link href="/wishlist"><Button variant="outline" size="sm" className="mt-3">Add to wishlist</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => {
              const owner = item.users
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand transition-colors">
                  <Link href={`/profile/${owner.username}`}>
                    <Avatar src={owner.avatar_url} alt={owner.username} fallback={owner.username} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${owner.username}`} className="font-medium text-gray-900 hover:text-brand text-sm">@{owner.username}</Link>
                    <p className="text-xs text-gray-500">{owner.city} · {formatCondition(item.condition)}{item.status === 'with_compensation' && item.min_compensation ? ` · +€${item.min_compensation}` : ''}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">{owner.rating_avg.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({owner.swaps_completed} swaps)</span>
                    </div>
                  </div>
                  {item.notes && <p className="text-xs text-gray-500 hidden sm:block max-w-xs truncate">&ldquo;{item.notes}&rdquo;</p>}
                  <Link href={`/proposals/new?libraryItemId=${item.id}&receiverId=${owner.id}`}>
                    <Button size="sm" className="gap-1 flex-shrink-0">Propose <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {wanters.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">People looking for this ({wanters.length})</h2>
          <div className="flex flex-wrap gap-2">
            {wanters.map(({ user_wishlist: w, users: u }) => (
              <Link key={w.id} href={`/profile/${u.username}`} className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white hover:border-brand text-sm transition-colors">
                <Avatar src={u.avatarUrl} alt={u.username} fallback={u.username} size="sm" />
                @{u.username}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
