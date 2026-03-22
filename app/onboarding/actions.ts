'use server'

import { db } from '@/lib/db'
import { userLibrary, userWishlist, users } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

export async function saveProfile(data: {
  username: string
  city: string
  country: string
}): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1)

  if (existing) return { error: 'Username già in uso' }

  try {
    await db.insert(users).values({
      id: user.id,
      username: data.username,
      city: data.city,
      country: data.country,
      emailConfirmed: false,
      plan: 'free',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore nella creazione del profilo'
    return { error: msg }
  }

  return {}
}

export async function saveLibraryItems(gameIds: number[]): Promise<void> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (gameIds.length === 0) return

  await db
    .insert(userLibrary)
    .values(
      gameIds.map((gameId) => ({
        userId: user.id,
        gameId,
        status: 'private' as const,
        condition: 'good' as const,
      }))
    )
    .onConflictDoNothing()
}

export async function saveWishlistItems(gameIds: number[]): Promise<void> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (gameIds.length === 0) return

  await db
    .insert(userWishlist)
    .values(gameIds.map((gameId) => ({ userId: user.id, gameId })))
    .onConflictDoNothing()
}
