import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const warnings: string[] = []
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  if (!process.env.AUTH_SECRET) warnings.push('AUTH_SECRET is not set')
  if (!process.env.NEXT_PUBLIC_SITE_URL) warnings.push('NEXT_PUBLIC_SITE_URL is not set')
  if (!process.env.CRON_SECRET) warnings.push('CRON_SECRET is not set')

  const [colleges, cutoffs, sources, trends, docs, corrections] = await Promise.all([
    prisma.college.count({ where: { instituteCode: { not: null } } }),
    prisma.cutoff.count(),
    prisma.sourceDocument.count(),
    prisma.capRoundTrend.count(),
    prisma.college.count({ where: { photoUrl: { not: null } } }),
    prisma.correctionRequest.count({ where: { status: 'new' } }),
  ])

  const report = {
    checkedAt: new Date().toISOString(),
    ok: true,
    warnings,
    counts: { colleges, cutoffs, sources, trends, withPhoto: docs, pendingCorrections: corrections },
  }

  await writeFile(resolve('docs/PREFLIGHT.md'), `# Preflight\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`)
  console.log(JSON.stringify(report, null, 2))
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
