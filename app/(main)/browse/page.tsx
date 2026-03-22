import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray, ilike, and, or } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Filter, Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCondition } from '@/lib/utils/format'
import type { LibraryItemWithGameAndUser } from '@/types/database'

export const metadata = { title: 'Browse — Gamexchange' }

const PLATFORMS = ['PS5', 'PS4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC']

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; city?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 24
  const offset = (page - 1) * pageSize

  const rows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(userLibrary.createdAt)
    .limit(pageSize)
    .offset(offset)

  let items: LibraryItemWithGameAndUser[] = rows.map(({ user_library: li, games: g, users: u }) => ({
    id: li.id, user_id: li.userId, game_id: li.gameId,
    status: li.status as LibraryItemWithGameAndUser['status'],
    min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
    condition: li.condition as LibraryItemWithGameAndUser['condition'],
    notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
    games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country, email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null, rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended, created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString() },
  }))

  if (params.q) {
    const q = params.q.toLowerCase()
    items = items.filter((item) => item.games.title.toLowerCase().includes(q))
  }
  if (params.platform) {
    const plat = params.platform.toLowerCase()
    items = items.filter((item) => item.games.platforms?.some((p) => p.toLowerCase().includes(plat)))
  }
  if (params.city) {
    const city = params.city.toLowerCase()
    items = items.filter((item) => item.users.city.toLowerCase().includes(city))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse games</h1>
        <p className="text-gray-500">Find games available to swap near you</p>
      </div>

      <form className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={params.q} placeholder="Search game title..." className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select name="platform" defaultValue={params.platform ?? ''} className="h-10 appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <input name="city" defaultValue={params.city} placeholder="City..." className="h-10 w-40 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
        <button type="submit" className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors">Search</button>
        {(params.q || params.platform || params.city) && (
          <Link href="/browse" className="h-10 px-4 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">Reset</Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No games found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{items.length} games found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {items.map((item) => (
              <BrowseCard key={item.id} item={item} />
            ))}
          </div>
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <Link href={`/browse?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">Previous</Link>
            )}
            {items.length === pageSize && (
              <Link href={`/browse?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">Next</Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function BrowseCard({ item }: { item: LibraryItemWithGameAndUser }) {
  const game = item.games
  const owner = item.users
  return (
    <Link href={`/games/${game.igdb_slug ?? game.id}`} className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-brand hover:shadow-md transition-all">
      <div className="relative aspect-[3/4] bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="(max-width: 640px) 50vw, 20vw" />
        ) : (
          <div className="flex h-full items-center justify-center"><Gamepad2 className="h-8 w-8 text-gray-300" /></div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="default" className="text-[10px] bg-white/90 text-gray-900">{formatCondition(item.condition)}</Badge>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">{game.title}</p>
        <p className="text-[11px] text-gray-500">@{owner.username} · {owner.city}</p>
        {item.status === 'with_compensation' && item.min_compensation && (
          <p className="text-[11px] text-brand font-medium mt-0.5">+ €{item.min_compensation.toFixed(0)}</p>
        )}
      </div>
    </Link>
  )
}
