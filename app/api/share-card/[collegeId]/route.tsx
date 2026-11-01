import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { demoColleges } from '@/lib/demo-data'
import { clearChance } from '@/lib/probability'
import { logEvent } from '@/lib/telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  const id = Number((await params).collegeId)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid college' }, { status: 400 })
  }

  const url = new URL(request.url)
  const percentile = Number(url.searchParams.get('percentile'))
  const branchParam = url.searchParams.get('branch') ?? ''
  const category = url.searchParams.get('category') ?? 'OPEN'

  let college: {
    name: string
    location: string
    cutoff: number | null
    capRound: number | null
    year: number | null
    sourceName: string | null
    sourceDate: Date | null
    verifiedAt: Date | null
  } | null = null

  try {
    const row = await prisma.college.findUnique({
      where: { id },
      select: {
        name: true,
        location: true,
        cutoffs: {
          where: {
            category,
            ...(branchParam ? { branch: { contains: branchParam, mode: 'insensitive' } } : {}),
          },
          orderBy: [{ year: 'desc' }, { capRound: 'desc' }],
          take: 1,
          select: {
            percentile: true,
            capRound: true,
            year: true,
            sourceName: true,
            sourceDate: true,
            verifiedAt: true,
          },
        },
      },
    })
    if (row) {
      college = {
        name: row.name,
        location: row.location,
        cutoff: row.cutoffs[0]?.percentile ?? null,
        capRound: row.cutoffs[0]?.capRound ?? null,
        year: row.cutoffs[0]?.year ?? null,
        sourceName: row.cutoffs[0]?.sourceName ?? null,
        sourceDate: row.cutoffs[0]?.sourceDate ?? null,
        verifiedAt: row.cutoffs[0]?.verifiedAt ?? null,
      }
    }
  } catch {
    const fallback = demoColleges.find((item) => item.id === id)
    if (fallback) {
      college = {
        name: fallback.name,
        location: fallback.location,
        cutoff: null,
        capRound: null,
        year: null,
        sourceName: null,
        sourceDate: null,
        verifiedAt: null,
      }
    }
  }

  if (!college) return Response.json({ error: 'College not found' }, { status: 404 })

  logEvent('share-card', String(id))
  const validPercentile = Number.isFinite(percentile) && percentile >= 0 && percentile <= 100
  const chance =
    validPercentile && college.cutoff !== null ? Math.round(clearChance(percentile, college.cutoff) * 100) : null
  const shareUrl = `${url.origin}/college/${id}`
  const sourceDate = college.sourceDate ? college.sourceDate.toISOString().slice(0, 10) : null
  const verified = Boolean(college.verifiedAt)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f7f3ec',
          color: '#1c1a17',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>CampusScope</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#6b655c' }}>Admissions intelligence · Maharashtra</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#8a5a2b' }}>
            Chance card
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            {college.name}
          </div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 28, color: '#6b655c' }}>{college.location}</div>

          <div style={{ display: 'flex', gap: 24, marginTop: 52 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#ffffff', borderRadius: 24, padding: '32px' }}>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b655c' }}>Directional chance</div>
              <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, color: chance !== null && chance >= 50 ? '#166534' : '#9a3412' }}>
                {chance !== null ? `${chance}%` : '—'}
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b655c' }}>
                {validPercentile ? `${percentile} percentile · ${category}` : 'Add your percentile'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#ffffff', borderRadius: 24, padding: '32px' }}>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b655c' }}>Closing cutoff</div>
              <div style={{ display: 'flex', fontSize: 72, fontWeight: 700 }}>
                {college.cutoff !== null ? college.cutoff : '—'}
              </div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6b655c' }}>
                {college.cutoff !== null
                  ? `${branchParam || 'All branches'} · Round ${college.capRound} · ${college.year}`
                  : 'No recorded row for this filter'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: 34, fontSize: 19, color: '#6b655c' }}>
            Source: {college.sourceName ?? 'legacy'} {sourceDate ? `· ${sourceDate}` : ''} ·{' '}
            {verified ? 'verified' : 'unverified'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #d9d2c5', paddingTop: 28 }}>
          <div style={{ display: 'flex', fontSize: 20, color: '#6b655c', maxWidth: 700 }}>
            Directional estimate from historical cutoffs, not an admission guarantee. Verify on the
            official CET Cell portal before applying.
          </div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700 }}>{shareUrl.replace(/^https?:\/\//, '')}</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}