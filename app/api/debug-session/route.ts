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

  // Test 1: la tabella users esiste?
  try {
    const tableCheck = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`
    )
    const tableExists = tableCheck.rows.length > 0

    if (!tableExists) {
      return NextResponse.json({ step: 'table_missing', user_id: user.id })
    }

    // Test 2: colonne della tabella
    const columns = await db.execute(
      sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position`
    )

    return NextResponse.json({
      step: 'table_exists',
      user_id: user.id,
      columns: columns.rows,
    })
  } catch (e: unknown) {
    return NextResponse.json({
      step: 'schema_check_error',
      error: e instanceof Error ? e.message : String(e),
      user_id: user.id,
    })
  }
}
