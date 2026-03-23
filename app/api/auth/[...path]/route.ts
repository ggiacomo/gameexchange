import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.NEON_AUTH_BASE_URL!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const FORWARDED_HEADERS = ['user-agent', 'content-type', 'authorization', 'referer', 'cookie']

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')

  const upstreamUrl = new URL(`${BASE_URL}/${pathStr}`)
  upstreamUrl.search = new URL(request.url).search

  const headers = new Headers()
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  // Always use our server URL as origin so Neon only needs one trusted origin
  headers.set('origin', APP_URL)
  headers.set('x-neon-auth-proxy', 'nextjs')
  headers.set('X-Neon-Auth-Next-Middleware', 'true')

  const body = request.body ? await request.text() : undefined

  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body,
  })

  const responseHeaders = new Headers()
  const setCookie = upstream.headers.get('set-cookie')
  if (setCookie) responseHeaders.set('set-cookie', setCookie)
  responseHeaders.set('content-type', upstream.headers.get('content-type') ?? 'application/json')

  const responseBody = await upstream.text()
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
