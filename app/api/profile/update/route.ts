import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(160).optional(),
  city: z.string().min(1),
  country: z.string().min(1),
  avatar_url: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const { username, bio, city, country, avatar_url } = parsed.data

  // Check username uniqueness (allow keeping the same username)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))

  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      username,
      bio: bio ?? null,
      city,
      country,
      ...(avatar_url !== undefined ? { avatarUrl: avatar_url } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}
