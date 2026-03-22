import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchGamesWithCache } from '@/lib/igdb/cache'

const querySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const result = querySchema.safeParse({ q: searchParams.get('q') })

  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 })
  }

  try {
    const games = await searchGamesWithCache(result.data.q)
    return NextResponse.json(games)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
