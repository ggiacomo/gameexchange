import { NextResponse } from 'next/server'

// Endpoint temporaneo di debug — da rimuovere dopo il fix
export async function GET() {
  const base = process.env.NEON_AUTH_BASE_URL
  if (!base) return NextResponse.json({ error: 'NEON_AUTH_BASE_URL not set' })

  const results: Record<string, unknown> = {}

  // Prova vari endpoint di admin/config
  const endpoints = [
    '/admin',
    '/admin/trusted-origins',
    '/admin/config',
    '/config',
    '/trusted-origins',
    '/.well-known/openid-configuration',
    '/info',
  ]

  for (const ep of endpoints) {
    const res = await fetch(`${base}${ep}`, {
      headers: { Origin: 'http://localhost:3000' },
    }).catch(() => null)
    if (res) {
      results[ep] = { status: res.status, body: (await res.text()).slice(0, 300) }
    }
  }

  // Prova anche PATCH/PUT per aggiungere trusted origin
  const patchRes = await fetch(`${base}/trusted-origins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ origin: 'https://gameexchange-teal.vercel.app' }),
  }).catch(() => null)
  if (patchRes) {
    results['POST /trusted-origins'] = { status: patchRes.status, body: (await patchRes.text()).slice(0, 300) }
  }

  return NextResponse.json({ base: base.replace(/\/\/[^/]+/, '//[REDACTED]'), results })
}
