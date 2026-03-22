import { getIGDBToken } from './auth'
import type { IGDBGame } from '@/types/igdb'

const BASE_URL = 'https://api.igdb.com/v4'

async function igdbRequest(endpoint: string, body: string): Promise<IGDBGame[]> {
  const token = await getIGDBToken()

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`IGDB request failed: ${response.status}`)
  }

  return response.json() as Promise<IGDBGame[]>
}

function normalizeCoverUrl(url: string): string {
  return url
    .replace(/^\/\//, 'https://')
    .replace('t_thumb', 't_cover_big')
}

export async function searchGames(query: string, limit = 10): Promise<IGDBGame[]> {
  const body = `fields name, cover.url, platforms.name, genres.name, first_release_date, slug;
search "${query.replace(/"/g, '')}";
limit ${limit};`

  const results = await igdbRequest('/games', body)

  return results.map((game) => ({
    ...game,
    cover: game.cover
      ? { ...game.cover, url: normalizeCoverUrl(game.cover.url) }
      : undefined,
  }))
}

export async function getGameById(igdbId: number): Promise<IGDBGame | null> {
  const body = `fields name, cover.url, platforms.name, genres.name, first_release_date, slug;
where id = ${igdbId};
limit 1;`

  const results = await igdbRequest('/games', body)

  if (!results[0]) return null

  const game = results[0]
  return {
    ...game,
    cover: game.cover
      ? { ...game.cover, url: normalizeCoverUrl(game.cover.url) }
      : undefined,
  }
}
