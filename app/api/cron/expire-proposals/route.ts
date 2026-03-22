import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { proposals } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expired = await db
    .update(proposals)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(eq(proposals.status, 'pending'), lt(proposals.expiresAt, new Date())))
    .returning({ id: proposals.id })

  return NextResponse.json({ expired: expired.length })
}
