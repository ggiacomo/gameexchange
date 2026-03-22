import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, userLibrary, games, reviews } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Star, Gamepad2, ArrowRight, MapPin, Calendar } from 'lucide-react'
import { formatDate, formatCondition } from '@/lib/utils/format'
import type { LibraryItemWithGame, UserRow } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return { title: `@${username} — Gamexchange` }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const currentUser = await getCurrentUser()

  const [profile] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  if (!profile) notFound()

  if (profile.isSuspended) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Account suspended</h1>
        <p className="text-gray-500">This user&apos;s account has been suspended.</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  const libraryRows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(
      inArray(userLibrary.status, ['available', 'with_compensation'])
    )
    .orderBy(userLibrary.createdAt)

  const library: LibraryItemWithGame[] = libraryRows
    .filter((r) => r.user_library.userId === profile.id)
    .map(({ user_library: li, games: g }) => ({
      id: li.id, user_id: li.userId, game_id: li.gameId,
      status: li.status as LibraryItemWithGame['status'],
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition as LibraryItemWithGame['condition'],
      notes: li.notes, created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
      games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    }))

  const reviewRows = await db
    .select({
      review: reviews,
      reviewer: users,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.revieweeId, profile.id))
    .orderBy(reviews.createdAt)
    .limit(20)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-5">
          <Avatar src={profile.avatarUrl} alt={profile.username} fallback={profile.username} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">@{profile.username}</h1>
              {profile.plan === 'pro' && <Badge variant="brand">Pro</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500">{profile.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500">Joined {formatDate(profile.createdAt.toISOString())}</span>
              </div>
            </div>
            {profile.bio && <p className="text-sm text-gray-700 mt-2">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{Number(profile.ratingAvg).toFixed(1)}</span>
                <span className="text-sm text-gray-500">({reviewRows.length} reviews)</span>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{profile.swapsCompleted}</span> swaps completed
              </div>
            </div>
          </div>
          {!isOwnProfile && (
            <Link href={`/browse?city=${profile.city}`}>
              <Button variant="outline" size="sm">Browse their city</Button>
            </Link>
          )}
          {isOwnProfile && (
            <Link href="/settings"><Button variant="outline" size="sm">Edit profile</Button></Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="games">
        <TabsList>
          <TabsTrigger value="games">Available games ({library.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviewRows.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="games">
          {!library.length ? (
            <div className="py-12 text-center text-gray-500">No games available for swap right now.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {library.map((item) => {
                const game = item.games
                return (
                  <Link key={item.id} href={`/games/${game.igdb_slug ?? game.id}`} className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-brand hover:shadow-md transition-all">
                    <div className="relative aspect-[3/4] bg-gray-100">
                      {game.cover_url ? (
                        <Image src={game.cover_url} alt={game.title} fill className="object-cover" sizes="25vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Gamepad2 className="h-8 w-8 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{game.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">{formatCondition(item.condition)}</span>
                        {item.status === 'with_compensation' && item.min_compensation && (
                          <span className="text-[11px] text-brand font-medium">+€{item.min_compensation}</span>
                        )}
                      </div>
                      {!isOwnProfile && (
                        <Link href={`/proposals/new?libraryItemId=${item.id}&receiverId=${profile.id}`} className="mt-2 flex items-center gap-1 text-[11px] text-brand font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                          Propose swap <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="reviews">
          {!reviewRows.length ? (
            <div className="py-12 text-center text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviewRows.map(({ review: r, reviewer: rev }) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={rev.avatarUrl} alt={rev.username} fallback={rev.username} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">@{rev.username}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt.toISOString())}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
