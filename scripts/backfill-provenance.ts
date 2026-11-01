import { PrismaClient } from '@prisma/client'

// One-time backfill after the provenance columns land. Existing rows become
// explicitly legacy/unverified; nothing is silently promoted to official.
const prisma = new PrismaClient()

async function main() {
  await prisma.dataSource.upsert({
    where: { name: 'legacy' },
    update: { status: 'inactive' },
    create: {
      name: 'legacy',
      url: 'https://campusscope.local/legacy',
      license: 'Pre-provenance rows — not official cutoff information',
      status: 'inactive',
    },
  })

  const data = { sourceName: 'legacy', confidence: 0.5, verifiedAt: null, verifiedBy: null }
  const [colleges, cutoffs, trends, seats, placements] = await Promise.all([
    prisma.college.updateMany({ where: { sourceName: null }, data }),
    prisma.cutoff.updateMany({ where: { sourceName: null }, data }),
    prisma.capRoundTrend.updateMany({ where: { sourceName: null }, data }),
    prisma.seatMatrix.updateMany({ where: { sourceName: null }, data }),
    prisma.placement.updateMany({ where: { sourceName: null }, data }),
  ])

  console.log(
    `Backfilled legacy provenance — colleges: ${colleges.count}, cutoffs: ${cutoffs.count}, trends: ${trends.count}, seats: ${seats.count}, placements: ${placements.count}`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
