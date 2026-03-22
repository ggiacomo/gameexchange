'use server'

import { db } from '@/lib/db'
import { users, userLibrary } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { LibraryStatus, GameCondition } from '@/types/database'

const FREE_LIBRARY_LIMIT = 50

const libraryItemSchema = z.object({
  game_id: z.number(),
  status: z.enum(['private', 'available', 'with_compensation'] as [LibraryStatus, ...LibraryStatus[]]),
  condition: z.enum(['mint', 'good', 'fair'] as [GameCondition, ...GameCondition[]]),
  notes: z.string().max(200).optional().nullable(),
  min_compensation: z.number().min(0).optional().nullable(),
})

export async function addLibraryItem(
  data: z.infer<typeof libraryItemSchema>
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = libraryItemSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const [profile] = await db.select({ plan: users.plan }).from(users).where(eq(users.id, user.id)).limit(1)

  if (profile?.plan === 'free') {
    const [{ value: libCount }] = await db
      .select({ value: count() })
      .from(userLibrary)
      .where(eq(userLibrary.userId, user.id))

    if (libCount >= FREE_LIBRARY_LIMIT) {
      return { error: `Free plan limited to ${FREE_LIBRARY_LIMIT} games. Upgrade to Pro for unlimited.` }
    }
  }

  try {
    await db.insert(userLibrary).values({
      userId: user.id,
      gameId: parsed.data.game_id,
      status: parsed.data.status,
      condition: parsed.data.condition,
      notes: parsed.data.notes ?? null,
      minCompensation: parsed.data.status === 'with_compensation'
        ? String(parsed.data.min_compensation ?? 0)
        : null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to add game'
    return { error: msg }
  }

  revalidatePath('/library')
  return {}
}

export async function updateLibraryItem(
  id: string,
  data: Partial<z.infer<typeof libraryItemSchema>>
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    await db
      .update(userLibrary)
      .set({
        ...(data.status && { status: data.status }),
        ...(data.condition && { condition: data.condition }),
        ...(data.notes !== undefined && { notes: data.notes }),
        minCompensation:
          data.status === 'with_compensation' ? String(data.min_compensation ?? 0) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(userLibrary.id, id), eq(userLibrary.userId, user.id)))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to update'
    return { error: msg }
  }

  revalidatePath('/library')
  return {}
}

export async function removeLibraryItem(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  await db
    .delete(userLibrary)
    .where(and(eq(userLibrary.id, id), eq(userLibrary.userId, user.id)))

  revalidatePath('/library')
  return {}
}
