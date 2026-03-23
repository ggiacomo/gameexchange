import { NextResponse } from 'next/server'

// Endpoint temporaneo di debug — da rimuovere dopo il fix
export async function GET() {
  const base = process.env.NEON_AUTH_BASE_URL
  if (!base) return NextResponse.json({ error: 'NEON_AUTH_BASE_URL not set' })

  const testOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://gameexchange-teal.vercel.app',
    // no origin
    null,
  ]

  const results: Record<string, { status: number; body: string }> = {}

  for (const origin of testOrigins) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (origin) headers['origin'] = origin

    try {
      const res = await fetch(`${base}/sign-in/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
      })
      const body = await res.text()
      results[origin ?? 'NO_ORIGIN'] = { status: res.status, body: body.slice(0, 200) }
    } catch (e) {
      results[origin ?? 'NO_ORIGIN'] = { status: -1, body: String(e) }
    }
  }

  return NextResponse.json(results)
}
