import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'

// POST endpoint che simula cosa fa createProfile: chiama getCurrentUser()
// con i cookie della richiesta corrente
export async function POST() {
  const user = await getCurrentUser()
  return NextResponse.json({
    user_found: user !== null,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
  })
}
