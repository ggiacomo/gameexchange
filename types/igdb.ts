export interface IGDBCover {
  id: number
  url: string
}

export interface IGDBPlatform {
  id: number
  name: string
}

export interface IGDBGenre {
  id: number
  name: string
}

export interface IGDBGame {
  id: number
  name: string
  slug: string
  cover?: IGDBCover
  platforms?: IGDBPlatform[]
  genres?: IGDBGenre[]
  first_release_date?: number
}

export type IGDBSearchResult = IGDBGame[]
