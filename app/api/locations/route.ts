import { prisma } from '@/lib/prisma'
import { demoColleges } from '@/lib/demo-data'

export async function GET() {
  try {
    const locations = await prisma.college.findMany({
      distinct: ['location'],
      select: { location: true },
      orderBy: { location: 'asc' },
    })
    return Response.json({ data: locations.map(({ location }) => location) })
  } catch {
    return Response.json({ data: [...new Set(demoColleges.map((college) => college.location))].sort(), source: 'preview-demo' })
  }
}
