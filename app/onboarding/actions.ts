'use server'

import { db } from '@/lib/db'
import { userLibrary, userWishlist } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

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
