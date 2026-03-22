'use server'

import { db } from '@/lib/db'
import { users, userWishlist } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

const FREE_WISHLIST_LIMIT = 10

export async function addWishlistItem(
  gameId: number,
  platformPreference?: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [profile] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, user.id)).limit(1)

  if (profile?.plan === 'free') {
    const [{ value: wishCount }] = await db
      .select({ value: count() })
      .from(userWishlist)
      .where(eq(userWishlist.userId, user.id))

    if (wishCount >= FREE_WISHLIST_LIMIT) {
      return { error: `Free plan limited to ${FREE_WISHLIST_LIMIT} wishlist items. Upgrade to Pro.` }
    }
  }

  try {
    await db.insert(userWishlist).values({
      userId: user.id,
      gameId,
      platformPreference: platformPreference ?? null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to add'
    return { error: msg }
  }

  revalidatePath('/wishlist')
  return {}
}

export async function removeWishlistItem(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  await db
    .delete(userWishlist)
    .where(and(eq(userWishlist.id, id), eq(userWishlist.userId, user.id)))

  revalidatePath('/wishlist')
  return {}
}
