import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function POST() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ step: 'auth', error: 'Not authenticated' })
  }

  // Test: raw insert con SQL diretto per catturare l'errore Postgres reale
  const testUsername = `dbgtest${Date.now()}`.slice(0, 20)
  try {
    await db.execute(
      sql`INSERT INTO users (id, username, city, country, email_confirmed, plan)
          VALUES (${user.id}, ${testUsername}, 'TestCity', 'IT', false, 'free')`
    )
    return NextResponse.json({ step: 'success', user_id: user.id, username: testUsername })
  } catch (e: unknown) {
    const err = e as Record<string, unknown>
    return NextResponse.json({
      step: 'insert_error',
      message: err.message ?? String(e),
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      severity: err.severity,
      user_id: user.id,
    })
  }
}
