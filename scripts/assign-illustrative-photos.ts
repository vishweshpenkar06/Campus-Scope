import { PrismaClient } from '@prisma/client'

// Colleges without a verified Commons match get a real Maharashtra engineering
// campus image, explicitly marked illustrative so it is never presented as
// that college's own photograph.
async function main() {
  const prisma = new PrismaClient()
  try {
    const sources = await prisma.college.findMany({
      where: { photoUrl: { not: null }, photoIllustrative: false },
      select: {
        photoUrl: true,
        photoCredit: true,
        photoLicense: true,
        photoSourceUrl: true,
      },
    })
    if (!sources.length) throw new Error('No verified campus photos available as illustrative sources')

    const missing = await prisma.college.findMany({
      where: { photoUrl: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    })

    let assigned = 0
    for (const [index, college] of missing.entries()) {
      const source = sources[index % sources.length]
      await prisma.college.update({
        where: { id: college.id },
        data: {
          photoUrl: source.photoUrl,
          photoCredit: source.photoCredit,
          photoLicense: source.photoLicense,
          photoSourceUrl: source.photoSourceUrl,
          photoIllustrative: true,
        },
      })
      assigned++
    }
    console.log(`Assigned ${assigned} illustrative campus photos from ${sources.length} verified sources.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
