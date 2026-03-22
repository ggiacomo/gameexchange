import { NextResponse } from 'next/server'

// better-auth handles OAuth callbacks at /api/auth/callback/*
// This route is no longer used but kept to avoid 404 on stale links
export async function GET() {
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
}
