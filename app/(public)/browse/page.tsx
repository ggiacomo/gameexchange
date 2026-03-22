import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray, and, ilike, sql } from 'drizzle-orm'
import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { CitySelect } from '@/components/ui/city-select'
import { LoadMoreBrowse } from '@/components/browse/load-more-browse'
import type { FeedItem } from '@/components/feed/load-more-games'

export const metadata = { title: 'Gamexchange — Scambia i tuoi videogiochi' }

const PLATFORMS = ['PS5', 'PS4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC']
const PAGE_SIZE = 24

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; city?: string }>
}) {
  const params = await searchParams

  const conditions = [inArray(userLibrary.status, ['available', 'with_compensation'])]
  if (params.q) conditions.push(ilike(games.title, `%${params.q}%`))
  if (params.platform) conditions.push(sql`${games.platforms} @> ARRAY[${params.platform}]::text[]`)
  if (params.city) conditions.push(ilike(users.city, `%${params.city}%`))

  const rows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(and(...conditions))
    .orderBy(userLibrary.createdAt)
    .limit(PAGE_SIZE + 1)

  const hasMore = rows.length > PAGE_SIZE
  const items: FeedItem[] = rows.slice(0, PAGE_SIZE).map(({ user_library: li, games: g, users: u }) => ({
    id: li.id, user_id: li.userId, game_id: li.gameId,
    status: li.status,
    min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
    condition: li.condition,
    notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
    games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, city: u.city },
  }))

  // Città disponibili
  const cityRows = await db
    .selectDistinct({ city: users.city })
    .from(users)
    .innerJoin(userLibrary, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(users.city)

  const cities = cityRows.map((r) => r.city).filter(Boolean) as string[]
  const hasFilters = params.q || params.platform || params.city

  return (
    <div>
      {/* Hero */}
      {!hasFilters && (
        <div className="relative overflow-hidden" style={{ minHeight: 360, backgroundImage: 'url(/background2.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8" id="games">
        {/* Filtri */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            href={params.city ? `/browse?city=${params.city}` : '/browse'}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!params.platform ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
          >
            Tutti
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p}
              href={`/browse?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.city ? { city: params.city } : {}), platform: p })}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${params.platform === p ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
            >
              {p}
            </Link>
          ))}

          {cities.length > 0 && <div className="w-px h-6 bg-gray-300 mx-1" />}

          <CitySelect cities={cities} currentCity={params.city} currentPlatform={params.platform} currentQ={params.q} />

          {hasFilters && (
            <Link href="/browse" className="px-4 py-2 rounded-full text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              × Reset
            </Link>
          )}
        </div>

        {/* Risultati */}
        {items.length === 0 ? (
          <div className="py-24 text-center">
            <Gamepad2 className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-bold text-[#1a1a1a] mb-1">Nessun gioco trovato</h3>
            <p className="text-gray-400 text-sm">Prova a cambiare i filtri</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 font-medium mb-4">{items.length}{hasMore ? '+' : ''} giochi disponibili</p>
            <LoadMoreBrowse
              initialItems={items}
              initialHasMore={hasMore}
              initialOffset={PAGE_SIZE}
              filters={{ q: params.q, platform: params.platform, city: params.city }}
            />
          </>
        )}
      </div>
    </div>
  )
}
