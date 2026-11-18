import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get('deep') === '1'
  const base = { status: 'ok', database: process.env.DATABASE_URL ? 'configured' : 'missing' }

  if (!deep || !process.env.DATABASE_URL) {
    return NextResponse.json(base, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ...base, database: 'reachable' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
