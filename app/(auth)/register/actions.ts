'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'

export async function createProfile(data: {
  username: string
  city: string
  country: string
}): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Check username availability
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1)

  if (existing) return { error: 'Username already taken' }

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
    const msg = e instanceof Error ? e.message : 'Failed to create profile'
    return { error: msg }
  }

  return {}
}
