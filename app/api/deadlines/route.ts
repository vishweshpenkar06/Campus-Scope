import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PUBLIC_CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }


export async function GET() {
  try {
    const data = await prisma.admissionDeadline.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 6,
    })
    return NextResponse.json({ data }, { headers: PUBLIC_CACHE })
  } catch {
    // banner is decorative — degrade silently instead of erroring the page
    return NextResponse.json({ data: [], source: 'unavailable' }, { headers: PUBLIC_CACHE })
  }
}
