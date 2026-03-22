import { db } from '@/lib/db'
import { games } from '@/lib/db/schema'
import { ilike, eq } from 'drizzle-orm'
import { searchGames, getGameById as fetchGameById } from './client'
import type { GameRow } from '@/types/database'
import type { IGDBGame } from '@/types/igdb'

function igdbToGame(game: IGDBGame): typeof games.$inferInsert {
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null

  return {
    id: game.id,
    title: game.name,
    coverUrl: game.cover?.url ?? null,
    platforms: game.platforms?.map((p) => p.name) ?? null,
    genres: game.genres?.map((g) => g.name) ?? null,
    releaseYear,
    igdbSlug: game.slug,
  }
}

function rowToGameRow(row: typeof games.$inferSelect): GameRow {
  return {
    id: row.id,
    title: row.title,
    cover_url: row.coverUrl,
    platforms: row.platforms ?? null,
    genres: row.genres ?? null,
    release_year: row.releaseYear,
    igdb_slug: row.igdbSlug,
  }
}

export async function searchGamesWithCache(query: string): Promise<GameRow[]> {
  if (query.length < 2) return []

  const cached = await db
    .select()
    .from(games)
    .where(ilike(games.title, `%${query}%`))
    .limit(10)

  if (cached.length >= 5) {
    return cached.map(rowToGameRow)
  }

  try {
    const igdbResults = await searchGames(query)
    const rows = igdbResults.map(igdbToGame)

    if (rows.length > 0) {
      await db.insert(games).values(rows).onConflictDoNothing()
    }

    return rows.map((r) => rowToGameRow(r as typeof games.$inferSelect))
  } catch {
    return cached.map(rowToGameRow)
  }
}

export async function getGameBySlug(slug: string): Promise<GameRow | null> {
  const [cached] = await db
    .select()
    .from(games)
    .where(eq(games.igdbSlug, slug))
    .limit(1)

  if (cached) return rowToGameRow(cached)

  try {
    const results = await searchGames(slug, 1)
    if (!results[0]) return null

    const row = igdbToGame(results[0])
    await db.insert(games).values(row).onConflictDoNothing()
    return rowToGameRow(row as typeof games.$inferSelect)
  } catch {
    return null
  }
}

export async function getGameById(igdbId: number): Promise<GameRow | null> {
  const [cached] = await db.select().from(games).where(eq(games.id, igdbId)).limit(1)

  if (cached) return rowToGameRow(cached)

  try {
    const igdbGame = await fetchGameById(igdbId)
    if (!igdbGame) return null

    const row = igdbToGame(igdbGame)
    await db.insert(games).values(row).onConflictDoNothing()
    return rowToGameRow(row as typeof games.$inferSelect)
  } catch {
    return null
  }
}
