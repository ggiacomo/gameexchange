import { getIGDBToken } from './auth'
import type { IGDBGame } from '@/types/igdb'

const BASE_URL = 'https://api.igdb.com/v4'

const MOCK_GAMES: IGDBGame[] = [
  { id: 1942, name: 'The Witcher 3: Wild Hunt', slug: 'the-witcher-3-wild-hunt', cover: { id: 1, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg' }, platforms: [{ id: 6, name: 'PC' }, { id: 48, name: 'PlayStation 4' }], genres: [{ id: 12, name: 'Role-playing (RPG)' }], first_release_date: 1431993600 },
  { id: 1877, name: 'Cyberpunk 2077', slug: 'cyberpunk-2077', cover: { id: 2, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hp7.jpg' }, platforms: [{ id: 6, name: 'PC' }, { id: 48, name: 'PlayStation 4' }, { id: 167, name: 'PlayStation 5' }], genres: [{ id: 12, name: 'Role-playing (RPG)' }], first_release_date: 1607990400 },
  { id: 119171, name: 'Elden Ring', slug: 'elden-ring', cover: { id: 3, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg' }, platforms: [{ id: 6, name: 'PC' }, { id: 167, name: 'PlayStation 5' }, { id: 169, name: 'Xbox Series X|S' }], genres: [{ id: 12, name: 'Role-playing (RPG)' }, { id: 25, name: 'Hack and slash/Beat \'em up' }], first_release_date: 1645747200 },
  { id: 126459, name: 'God of War Ragnarök', slug: 'god-of-war-ragnarok', cover: { id: 4, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }, { id: 167, name: 'PlayStation 5' }], genres: [{ id: 25, name: 'Hack and slash/Beat \'em up' }, { id: 31, name: 'Adventure' }], first_release_date: 1667260800 },
  { id: 119388, name: 'Horizon Forbidden West', slug: 'horizon-forbidden-west', cover: { id: 5, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }, { id: 167, name: 'PlayStation 5' }], genres: [{ id: 12, name: 'Role-playing (RPG)' }, { id: 31, name: 'Adventure' }], first_release_date: 1644883200 },
  { id: 136189, name: 'FIFA 23', slug: 'fifa-23', cover: { id: 6, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }, { id: 167, name: 'PlayStation 5' }, { id: 169, name: 'Xbox Series X|S' }], genres: [{ id: 14, name: 'Sport' }], first_release_date: 1663718400 },
  { id: 215, name: 'Grand Theft Auto V', slug: 'grand-theft-auto-v', cover: { id: 7, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }, { id: 167, name: 'PlayStation 5' }, { id: 6, name: 'PC' }], genres: [{ id: 31, name: 'Adventure' }], first_release_date: 1379289600 },
  { id: 7346, name: 'The Legend of Zelda: Breath of the Wild', slug: 'the-legend-of-zelda-breath-of-the-wild', cover: { id: 8, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg' }, platforms: [{ id: 130, name: 'Nintendo Switch' }], genres: [{ id: 12, name: 'Role-playing (RPG)' }, { id: 31, name: 'Adventure' }], first_release_date: 1488931200 },
  { id: 103298, name: 'Red Dead Redemption 2', slug: 'red-dead-redemption-2', cover: { id: 9, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }, { id: 49, name: 'Xbox One' }, { id: 6, name: 'PC' }], genres: [{ id: 31, name: 'Adventure' }], first_release_date: 1540425600 },
  { id: 26226, name: 'Marvel\'s Spider-Man', slug: 'marvels-spider-man', cover: { id: 10, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg' }, platforms: [{ id: 48, name: 'PlayStation 4' }], genres: [{ id: 25, name: 'Hack and slash/Beat \'em up' }, { id: 31, name: 'Adventure' }], first_release_date: 1536105600 },
]

function mockSearch(query: string): IGDBGame[] {
  const q = query.toLowerCase()
  return MOCK_GAMES.filter((g) => g.name.toLowerCase().includes(q))
}

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

const hasIGDBCredentials = !!(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET)

export async function searchGames(query: string, limit = 10): Promise<IGDBGame[]> {
  if (!hasIGDBCredentials) {
    return mockSearch(query).slice(0, limit)
  }

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
  if (!hasIGDBCredentials) {
    return MOCK_GAMES.find((g) => g.id === igdbId) ?? null
  }

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
