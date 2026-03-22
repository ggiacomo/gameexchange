import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userLibrary, userWishlist, games, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Link from 'next/link'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadMoreGames, type FeedItem } from '@/components/feed/load-more-games'

export const metadata = { title: 'Feed — Gamexchange' }

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (!user) return null

  const PAGE_SIZE = 12

  // Recent available games (fetch 13 to detect hasMore)
  const recentRows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(userLibrary.createdAt)
    .limit(PAGE_SIZE + 1)

  const hasMore = recentRows.length > PAGE_SIZE
  const recentGames: FeedItem[] = recentRows
    .slice(0, PAGE_SIZE)
    .filter((r) => r.user_library.userId !== user.id)
    .map(({ user_library: li, games: g, users: u }) => ({
      id: li.id, user_id: li.userId, game_id: li.gameId,
      status: li.status,
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition,
      notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
      games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
      users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, city: u.city },
    }))

  // Wishlist matches
  const wishlistRows = await db
    .select({ gameId: userWishlist.gameId })
    .from(userWishlist)
    .where(eq(userWishlist.userId, user.id))

  const wishlistGameIds = wishlistRows.map((w) => w.gameId)

  let wishlistMatches: FeedItem[] = []
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
        status: li.status,
        min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
        condition: li.condition,
        notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
        games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
        users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, city: u.city },
      }))
  }

  return (
    <div className="space-y-10">
      {params.welcome === '1' && (
        <div className="rounded-2xl bg-[#1a1a1a] p-6 text-white">
          <h2 className="text-xl font-extrabold mb-1 tracking-tight">Benvenuto su Gamexchange!</h2>
          <p className="text-white/70 text-sm">
            {wishlistMatches.length > 0
              ? `Abbiamo trovato ${wishlistMatches.length} gioch${wishlistMatches.length > 1 ? 'i' : 'o'} dalla tua wishlist disponibili per lo scambio!`
              : 'Inizia aggiungendo giochi alla tua libreria o sfoglia quelli disponibili vicino a te.'}
          </p>
        </div>
      )}

      {wishlistMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">Dalla tua wishlist</h2>
            <Link href="/wishlist" className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
              Vai alla wishlist <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <GameGrid items={wishlistMatches} currentUserId={user.id} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">Disponibili di recente</h2>
          <Link href="/browse" className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
            Vedi tutti <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentGames.length > 0 ? (
          <LoadMoreGames
            initialItems={recentGames}
            initialHasMore={hasMore}
            initialOffset={PAGE_SIZE}
          />
        ) : (
          <div className="rounded-2xl bg-white shadow-sm p-12 text-center">
            <Gamepad2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nessun gioco disponibile ancora.</p>
            <Link href="/library">
              <Button className="mt-4" size="sm">Aggiungi i tuoi giochi</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function GameGrid({ items, currentUserId }: { items: FeedItem[]; currentUserId: string }) {
  const filtered = items.filter((item) => item.user_id !== currentUserId)
  return (
    <LoadMoreGames
      initialItems={filtered}
      initialHasMore={false}
      initialOffset={0}
    />
  )
}
