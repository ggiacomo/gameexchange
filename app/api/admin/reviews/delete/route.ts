import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { reviews, authUser } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin
  const [authRow] = await db.select({ email: authUser.email }).from(authUser).where(eq(authUser.id, user.id))
  if (authRow?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await db.delete(reviews).where(eq(reviews.id, id))

  return NextResponse.json({ success: true })
}
