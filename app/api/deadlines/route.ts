import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const data = await prisma.admissionDeadline.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 6,
    })
    return NextResponse.json({ data })
  } catch {
    // banner is decorative — degrade silently instead of erroring the page
    return NextResponse.json({ data: [], source: 'unavailable' })
  }
}
