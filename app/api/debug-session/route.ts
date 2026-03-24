import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ step: 'auth', error: 'Not authenticated' })
  }

  // Test: check if username exists
  const testUsername = `dbgtest${Date.now()}`.slice(0, 20)
  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, testUsername))
      .limit(1)

    // Test: insert user
    await db.insert(users).values({
      id: user.id,
      username: testUsername,
      city: 'TestCity',
      country: 'IT',
      emailConfirmed: false,
      plan: 'free',
    })

    return NextResponse.json({
      step: 'success',
      user_id: user.id,
      username_exists: !!existing,
      inserted: true,
    })
  } catch (e: unknown) {
    return NextResponse.json({
      step: 'db_error',
      error: e instanceof Error ? e.message : String(e),
      user_id: user.id,
    })
  }
}
