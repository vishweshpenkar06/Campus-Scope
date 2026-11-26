import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

// Cache the Wikimedia thumbnails locally so the LCP image is served by our own
// origin and Next can optimize/resize it. Attribution stays in the DB.
async function main() {
  const prisma = new PrismaClient()
  const dir = resolve('public/colleges')
  await mkdir(dir, { recursive: true })
  try {
    const sources = await prisma.college.findMany({
      where: { photoUrl: { not: null }, photoIllustrative: false, instituteCode: { not: null } },
      select: { instituteCode: true, photoUrl: true },
    })
    const seen = new Set<string>()
    let saved = 0
    for (const college of sources) {
      const remote = college.photoUrl!
      if (seen.has(remote) || remote.startsWith('/')) continue
      const parsed = new URL(remote)
      if (parsed.protocol !== 'https:' || !/^(upload|thumb)\.wikimedia\.org$/.test(parsed.hostname)) {
        console.warn(`skip ${college.instituteCode}: untrusted photo host`)
        continue
      }
      seen.add(remote)

      const response = await fetch(remote, {
        headers: { 'user-agent': 'CampusScope/1.0 (photo cache)' },
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) {
        console.warn(`skip ${college.instituteCode}: HTTP ${response.status}`)
        continue
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.startsWith('image/')) continue
      const bytes = Buffer.from(await response.arrayBuffer())
      const path = `/colleges/${college.instituteCode}.jpg`
      await writeFile(resolve(`public${path}`), bytes)
      await prisma.college.updateMany({
        where: { photoUrl: remote },
        data: { photoUrl: path },
      })
      saved++
      console.log(`saved ${college.instituteCode} (${Math.round(bytes.length / 1024)}KB)`)
    }
    console.log(`Localized ${saved} source photos; ${await prisma.college.count({ where: { photoUrl: { startsWith: '/colleges/' } } })} colleges now use local images.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
