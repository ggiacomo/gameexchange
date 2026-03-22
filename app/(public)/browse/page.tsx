import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { Gamepad2 } from 'lucide-react'
import type { LibraryItemWithGameAndUser } from '@/types/database'
import { CitySelect } from '@/components/ui/city-select'

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

  // Città disponibili (utenti con almeno un gioco disponibile)
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
      {/* Hero — solo se non ci sono filtri attivi */}
      {!hasFilters && (
        <div className="relative overflow-hidden" style={{ minHeight: 420, backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Overlay scuro per leggibilità */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Glow sinistro */}
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #e4000f 0%, transparent 70%)', filter: 'blur(60px)' }} />
          {/* Glow destro */}
          <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #ff6b00 0%, transparent 70%)', filter: 'blur(80px)' }} />

          <div className="relative mx-auto max-w-[1280px] px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
            {/* Testo */}
            <div className="flex-1 text-center md:text-left z-10">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-6">
                  <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                  <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">100% gratuito</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a1a1a] tracking-tight leading-[1.1] mb-5">
                  Hai giochi che<br />
                  <span className="text-brand">non usi più?</span>
                </h1>
                <p className="text-gray-500 text-lg mb-8 max-w-lg leading-relaxed">
                  Scambiali con altri giocatori vicino a te.<br />Gratis, semplice, senza intermediari.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link href="/register" className="h-13 px-8 py-3.5 rounded-full bg-brand text-white font-bold text-base hover:bg-brand-dark transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand/30 flex items-center justify-center">
                    Inizia a pubblicare →
                  </Link>
                  <Link href="#games" className="h-13 px-8 py-3.5 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors flex items-center justify-center">
                    Sfoglia i giochi
                  </Link>
                </div>
                {/* Stats */}
                <div className="flex gap-8 mt-8 justify-center md:justify-start">
                  <div>
                    <p className="text-2xl font-extrabold text-[#1a1a1a]">{items.length}+</p>
                    <p className="text-xs text-gray-400 mt-0.5">Giochi disponibili</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <p className="text-2xl font-extrabold text-[#1a1a1a]">0€</p>
                    <p className="text-xs text-gray-400 mt-0.5">Commissioni</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <p className="text-2xl font-extrabold text-[#1a1a1a]">ITA</p>
                    <p className="text-xs text-gray-400 mt-0.5">Solo Italia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover art */}
            <div className="hidden lg:block relative flex-shrink-0 w-80 h-64">
              {items.slice(0, 5).map((item, i) => {
                const angles = [-8, -3, 2, 7, 12]
                const tops = [20, 0, 30, 10, 40]
                const lefts = [0, 60, 120, 175, 230]
                return (
                  <div
                    key={item.id}
                    className="absolute h-44 w-28 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    style={{ transform: `rotate(${angles[i]}deg)`, top: tops[i], left: lefts[i], zIndex: i }}
                  >
                    {item.games.cover_url ? (
                      <Image src={item.games.cover_url} alt={item.games.title} fill className="object-cover" sizes="112px" />
                    ) : (
                      <div className="h-full bg-white/5 flex items-center justify-center">
                        <Gamepad2 className="h-8 w-8 text-white/20" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 py-8" id="games">
        {/* Filtri */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Platform pills */}
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

          {/* Separatore */}
          {cities.length > 0 && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* Dropdown città */}
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
