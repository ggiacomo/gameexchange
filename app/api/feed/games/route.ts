import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray, ne } from 'drizzle-orm'

const PAGE_SIZE = 12

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0')

  const rows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(inArray(userLibrary.status, ['available', 'with_compensation']))
    .orderBy(userLibrary.createdAt)
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasMore = rows.length > PAGE_SIZE
  const items = rows.slice(0, PAGE_SIZE).filter((r) => r.user_library.userId !== user.id)

  return NextResponse.json({
    items: items.map(({ user_library: li, games: g, users: u }) => ({
      id: li.id,
      user_id: li.userId,
      game_id: li.gameId,
      status: li.status,
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition,
      notes: li.notes,
      created_at: li.createdAt.toISOString(),
      updated_at: li.updatedAt.toISOString(),
      games: {
        id: g.id,
        title: g.title,
        cover_url: g.coverUrl,
        platforms: g.platforms ?? null,
        genres: g.genres ?? null,
        release_year: g.releaseYear,
        igdb_slug: g.igdbSlug,
      },
      users: {
        id: u.id,
        username: u.username,
        avatar_url: u.avatarUrl,
        city: u.city,
      },
    })),
    hasMore,
    nextOffset: offset + PAGE_SIZE,
  })
}
