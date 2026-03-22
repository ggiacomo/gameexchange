import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { Gamepad2 } from 'lucide-react'
import type { LibraryItemWithGameAndUser } from '@/types/database'

export const metadata = { title: 'Gamexchange — Scambia i tuoi videogiochi' }

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
    items = items.filter((item) => item.users.city?.toLowerCase().includes(city))
  }

  const hasFilters = params.q || params.platform || params.city

  return (
    <div>
      {/* Hero — solo se non ci sono filtri attivi */}
      {!hasFilters && (
        <div className="relative bg-[#1a1a1a] overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e4000f 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e4000f 0%, transparent 40%)' }}
          />
          <div className="relative mx-auto max-w-[1280px] px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Hai giochi che<br />non usi più?
              </h1>
              <p className="text-white/60 text-lg mb-8 max-w-md">
                Scambiali con altri giocatori vicino a te. Gratis, semplice, senza intermediari.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/register"
                  className="h-12 px-8 rounded-full bg-brand text-white font-bold text-base hover:bg-brand-dark transition-colors"
                >
                  Inizia a pubblicare
                </Link>
                <Link
                  href="#games"
                  className="h-12 px-8 rounded-full border-2 border-white/20 text-white font-bold text-base hover:bg-white/10 transition-colors"
                >
                  Sfoglia i giochi
                </Link>
              </div>
            </div>
            {/* Cover art decorativi */}
            <div className="hidden md:flex gap-3 flex-shrink-0 rotate-3">
              {items.slice(0, 4).map((item) => (
                <div key={item.id} className="relative h-36 w-24 rounded-xl overflow-hidden shadow-2xl even:-translate-y-4">
                  {item.games.cover_url ? (
                    <Image src={item.games.cover_url} alt={item.games.title} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="h-full bg-white/10 flex items-center justify-center">
                      <Gamepad2 className="h-8 w-8 text-white/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8" id="games">
        {/* Filtri platform come pill */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={hasFilters ? '/browse' : '#'}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!params.platform ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
          >
            Tutti
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p}
              href={`/browse?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), platform: p })}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${params.platform === p ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'}`}
            >
              {p}
            </Link>
          ))}
          {params.city && (
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-brand text-white">
              📍 {params.city}
            </span>
          )}
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
            <p className="text-sm text-gray-400 font-medium mb-4">{items.length} giochi disponibili</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {items.map((item) => (
                <BrowseCard key={item.id} item={item} />
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Link href={`/browse?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="px-5 py-2.5 rounded-full border-2 border-[#1a1a1a] text-sm font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all">Precedente</Link>
              )}
              {items.length === pageSize && (
                <Link href={`/browse?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="px-5 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#333] transition-colors">Successiva</Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function BrowseCard({ item }: { item: LibraryItemWithGameAndUser }) {
  const game = item.games
  const owner = item.users
  return (
    <Link href={`/games/${game.igdb_slug ?? game.id}`} className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative aspect-[3/4] bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-300" sizes="(max-width: 640px) 50vw, 20vw" />
        ) : (
          <div className="flex h-full items-center justify-center"><Gamepad2 className="h-8 w-8 text-gray-300" /></div>
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
