import { NextRequest, NextResponse } from 'next/server'
import { allow, clientIp } from './lib/rate-limit'

const SENSITIVE_PREFIXES = [
  '/api/user/',
  '/api/admin/',
  '/api/auth/',
  '/api/leads',
  '/api/feedback',
  '/api/ask',
  '/api/predict',
  '/api/mentors/',
]

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (!path.startsWith('/api/')) return NextResponse.next()

  const response = NextResponse.next()
  if (SENSITIVE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    response.headers.set('Cache-Control', 'private, no-store')
  }

  // Auth.js has its own throttling and JSON error contract; don't add a second
  // limiter in front of session/provider polling.
  if (path.startsWith('/api/auth/')) return response

  if (!(await allow(`api:${clientIp(request)}`, 120))) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } }
    )
  }
  return response
}

export const config = { matcher: '/api/:path*' }
