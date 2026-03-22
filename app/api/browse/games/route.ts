import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userLibrary, games, users } from '@/lib/db/schema'
import { eq, inArray, and, ilike, sql } from 'drizzle-orm'

const PAGE_SIZE = 24

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const offset = Number(searchParams.get('offset') ?? '0')
  const q = searchParams.get('q') ?? ''
  const platform = searchParams.get('platform') ?? ''
  const city = searchParams.get('city') ?? ''

  const conditions = [inArray(userLibrary.status, ['available', 'with_compensation'])]

  if (q) {
    conditions.push(ilike(games.title, `%${q}%`))
  }
  if (platform) {
    conditions.push(sql`${games.platforms} @> ARRAY[${platform}]::text[]`)
  }
  if (city) {
    conditions.push(ilike(users.city, `%${city}%`))
  }

  const rows = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .where(and(...conditions))
    .orderBy(userLibrary.createdAt)
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasMore = rows.length > PAGE_SIZE

  return NextResponse.json({
    items: rows.slice(0, PAGE_SIZE).map(({ user_library: li, games: g, users: u }) => ({
      id: li.id,
      user_id: li.userId,
      game_id: li.gameId,
      status: li.status,
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition,
      notes: li.notes,
      created_at: li.createdAt.toISOString(),
      updated_at: li.updatedAt.toISOString(),
      games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
      users: { id: u.id, username: u.username, avatar_url: u.avatarUrl, city: u.city },
    })),
    hasMore,
    nextOffset: offset + PAGE_SIZE,
  })
}
