import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, authUser } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin
  const [authRow] = await db.select({ email: authUser.email }).from(authUser).where(eq(authUser.id, user.id))
  if (authRow?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, suspend } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  await db.update(users).set({ isSuspended: !!suspend, updatedAt: new Date() }).where(eq(users.id, userId))

  return NextResponse.json({ success: true })
}
