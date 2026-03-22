import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Gamepad2, RefreshCw, MapPin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeedItem } from '@/components/feed/load-more-games'

export const metadata = { title: 'Gamexchange — Scambia i tuoi videogiochi' }

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect('/feed')

  // Ultimi giochi aggiunti
  const rows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(userLibrary.createdAt)
    .limit(12)

  const recentGames: FeedItem[] = rows.map(({ user_library: li, games: g, users: u }) => ({
    id: li.id, user_id: li.userId, game_id: li.gameId,
    status: li.status,
    min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
    condition: li.condition,
    notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
    games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, city: u.city },
  }))

  return (
    <div>
      {/* Hero */}
      <div
        className="relative"
        style={{
          minHeight: 480,
          backgroundImage: 'url(/background2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative mx-auto max-w-[1280px] px-4 h-full flex items-center" style={{ minHeight: 480 }}>
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Scambia i tuoi giochi<br />con chi ti sta vicino
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Dai nuova vita ai giochi che non usi più. Trova quello che cerchi nella tua città, senza pagare.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base px-6">
                  Inizia gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/browse">
                <Button size="lg" variant="outline" className="text-base px-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Sfoglia i giochi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Come funziona */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-[1280px] px-4">
          <h2 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight text-center mb-10">Come funziona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <Gamepad2 className="h-7 w-7 text-brand" />, title: 'Aggiungi i tuoi giochi', desc: 'Metti in lista i giochi fisici che vuoi scambiare.' },
              { icon: <RefreshCw className="h-7 w-7 text-brand" />, title: 'Proponi uno scambio', desc: 'Trova chi ha il gioco che cerchi e invia una proposta.' },
              { icon: <MapPin className="h-7 w-7 text-brand" />, title: 'Scambiate di persona', desc: 'Vi incontrate in città e scambiate i giochi. Semplice.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-[#1a1a1a] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giochi recenti */}
      {recentGames.length > 0 && (
        <div className="mx-auto max-w-[1280px] px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight">Disponibili ora</h2>
            <Link href="/browse" className="text-sm text-brand font-semibold hover:underline flex items-center gap-1">
              Vedi tutti <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentGames.map((item) => {
              const game = item.games
              const owner = item.users
              return (
                <Link
                  key={item.id}
                  href={`/games/${game.igdb_slug ?? game.id}`}
                  className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {game.cover_url ? (
                      <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-300" sizes="(max-width: 640px) 50vw, 16vw" />
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
            })}
          </div>
        </div>
      )}

      {/* CTA finale */}
      <div className="bg-[#1a1a1a] py-16">
        <div className="mx-auto max-w-[1280px] px-4 text-center">
          <Star className="h-8 w-8 text-brand mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Pronto a iniziare?</h2>
          <p className="text-white/50 mb-6">Registrati gratis e trova subito i giochi che cerchi nella tua città.</p>
          <Link href="/register">
            <Button size="lg" className="gap-2 text-base px-8">
              Crea il tuo account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
