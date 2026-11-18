export type DteSeatType = 'Maharashtra' | 'All India'

export type ParsedDteCutoff = {
  instituteCode: string
  collegeName: string
  branchCode: string
  branchName: string
  level: string
  seatType: DteSeatType
  stage: string
  categoryCode: string
  category: string
  rank: number | null
  percentile: number
  page: number
}

export type DteParseResult = {
  rows: ParsedDteCutoff[]
  warnings: string[]
  pages: number
  institutes: number
  branches: number
}

type Column = { code: string; start: number }

const ROMAN_STAGE = /^((?:VIII|VII|VI|V|IV|III|II|I|MH|AI)(?:-Non(?:\s+(?:Defence|PWD))?)?)\s+(.+)$/

const CATEGORY_MAP: Record<string, string> = {
  GOPENS: 'OPEN',
  GSCS: 'SC',
  GSTS: 'ST',
  GVJS: 'VJ/NT',
  GNT1S: 'VJ/NT',
  GNT2S: 'VJ/NT',
  GNT3S: 'VJ/NT',
  GOBCS: 'OBC',
  GSEBCS: 'SEBC',
  LOPENS: 'OPEN',
  LSCS: 'SC',
  LSTS: 'ST',
  LVJS: 'VJ/NT',
  LNT1S: 'VJ/NT',
  LNT2S: 'VJ/NT',
  LNT3S: 'VJ/NT',
  LOBCS: 'OBC',
  LSEBCS: 'SEBC',
  PWDOPENS: 'PWD',
  PWDOBCS: 'PWD',
  PWDSCS: 'PWD',
  PWDRSCS: 'PWD',
  PWDROBCS: 'PWD',
  DEFOPENS: 'DEF',
  DEFOBCS: 'DEF',
  DEFRSEBCS: 'DEF',
  DEFRSCS: 'DEF',
  DEFRNT1S: 'DEF',
  DEFRNT2S: 'DEF',
  DEFROBCS: 'DEF',
  TFWS: 'TFWS',
  EWS: 'EWS',
  ORPHAN: 'ORPHAN',
  ORPHANI: 'ORPHAN',
  ORPHANN: 'ORPHAN',
  MI: 'MINORITY',
  EWSS: 'EWS',
}

export function normalizeDteCategory(code: string): string | null {
  const clean = code.trim().toUpperCase()
  if (!clean) return null
  if (CATEGORY_MAP[clean]) return CATEGORY_MAP[clean]

  // PWD/DEF are prefixes that can carry a level suffix and a base category.
  if (clean.startsWith('PWD')) return 'PWD'
  if (clean.startsWith('DEF')) return 'DEF'

  // Header codes are built as [G|L] + base + [H|O|S]:
  // G/L = General/Ladies, H = Home University, O = Other than Home, S = State.
  let base = clean.replace(/[HOS]$/, '')
  if (/^[GL]/.test(base)) base = base.slice(1)
  if (base.startsWith('OPEN')) return 'OPEN'
  if (base.startsWith('NT') || base.startsWith('VJ')) return 'VJ/NT'
  if (base.startsWith('OBC')) return 'OBC'
  if (base.startsWith('SEBC')) return 'SEBC'
  if (base.startsWith('SC')) return 'SC'
  if (base.startsWith('ST')) return 'ST'
  return null
}

export function dteLevelForCode(code: string, fallback: string): string {
  const clean = code.trim().toUpperCase()
  if (CATEGORY_MAP[clean] || clean.startsWith('PWD') || clean.startsWith('DEF')) return fallback
  if (/[H]$/.test(clean)) return 'Home University'
  if (/[O]$/.test(clean)) return 'Other than Home University'
  if (/[S]$/.test(clean)) return 'State Level'
  return fallback
}

export function parseDteCutoffText(
  text: string,
  options: { year: number; capRound: number; seatType?: DteSeatType }
): DteParseResult {
  const pages = text.split('\f')
  const rows: ParsedDteCutoff[] = []
  const warnings: string[] = []
  const institutes = new Set<string>()
  const branches = new Set<string>()
  const seatType = options.seatType ?? 'Maharashtra'

  let instituteCode = ''
  let collegeName = ''
  let branchCode = ''
  let branchName = ''
  let level = 'State Level'
  let columns: Column[] = []

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const lines = pages[pageIndex].split(/\r?\n/)
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('Legends:')) continue
      if (/^Page \d+ of \d+/i.test(trimmed)) continue
      if (/^Printed on/i.test(trimmed)) continue

      const institute = /^(\d{4,5})\s*-\s*(.+)$/.exec(trimmed)
      if (institute) {
        instituteCode = institute[1].padStart(5, '0')
        collegeName = institute[2].trim()
        institutes.add(instituteCode)
        branchCode = ''
        branchName = ''
        columns = []
        continue
      }

      const branch = /^(\d{9,10}[A-Z]*)\s*-\s*(.+)$/.exec(trimmed)
      if (branch) {
        const match = /^(\d+)([A-Z]*)$/.exec(branch[1])!
        branchCode = match[1].padStart(10, '0') + match[2]
        branchName = branch[2].trim()
        branches.add(`${instituteCode}|${branchCode}`)
        columns = []
        continue
      }

      if (/^(State Level|Home University|Other than Home University|All India)\s*$/i.test(trimmed)) {
        const match = /^(State Level|Home University|Other than Home University|All India)/i.exec(trimmed)
        level = (match?.[1] ?? level).replace(/^Other Than/i, 'Other than')
        columns = []
        continue
      }
      if (/Seats Allotted to Other Than Home University Candidates/i.test(trimmed)) {
        level = 'Other than Home University'
        columns = []
        continue
      }
      if (/Seats Allotted to Home University Candidates/i.test(trimmed)) {
        level = 'Home University'
        columns = []
        continue
      }
      if (/^Other Than Home University Seats/i.test(trimmed)) {
        level = 'Other than Home University'
        columns = []
        continue
      }
      if (/^Minority Seats Allotted/i.test(trimmed)) {
        level = 'Minority'
        columns = []
        continue
      }
      if (trimmed.startsWith('Status:')) continue
      if (trimmed.startsWith('Cut Off List')) continue
      if (trimmed.startsWith('Government of Maharashtra')) continue
      if (trimmed.startsWith('State Common Entrance Test Cell')) continue
      if (trimmed.startsWith('Degree Courses')) continue

      if (trimmed.startsWith('Stage') && /[A-Z]{3,}/.test(trimmed)) {
        columns = parseHeaderColumns(line)
        continue
      }

      // Wrapped header fragments such as the final S in PWDROBCS.
      if (columns.length && /^[A-Z]{1,2}$/.test(trimmed)) {
        columns[columns.length - 1].code += trimmed
        continue
      }

      const stage = ROMAN_STAGE.exec(trimmed)
      if (!stage || !instituteCode || !branchCode || !columns.length) continue
      if (!/\d/.test(stage[2])) continue

      let stageLabel = stage[1]
      const rankTokens = numbersWithPositions(line, stageLabel.length, false)
      if (!rankTokens.length) continue

      const percentileTokens: Array<{ value: number; position: number }> = []
      let cursor = lineIndex + 1
      while (cursor < lines.length) {
        const next = lines[cursor]
        const nextTrimmed = next.trim()
        if (!nextTrimmed) {
          cursor++
          continue
        }
        // I-Non rows put the descriptor (PWD / Defence) on the following line,
        // sometimes alongside the percentile line.
        if (stageLabel.endsWith('-Non')) {
          const descriptor = /^(PWD|Defence)\b/i.exec(nextTrimmed)
          if (descriptor) {
            stageLabel = `${stageLabel} ${descriptor[1]}`
            percentileTokens.push(...numbersWithPositions(next, 0, true))
            cursor++
            if (percentileTokens.length >= rankTokens.length) break
            continue
          }
        }
        if (!nextTrimmed.startsWith('(')) break
        percentileTokens.push(...numbersWithPositions(next, 0, true))
        cursor++
        if (percentileTokens.length >= rankTokens.length) break
      }

      if (percentileTokens.length !== rankTokens.length) {
        warnings.push(
          `page ${pageIndex + 1}: rank/percentile count mismatch for ${instituteCode}/${branchCode} stage=${stageLabel} (${rankTokens.length} vs ${percentileTokens.length})`
        )
        lineIndex = Math.max(lineIndex, cursor - 1)
        continue
      }

      for (let index = 0; index < rankTokens.length; index++) {
        const rank = rankTokens[index]
        const percentile = percentileTokens[index]
        const column = columnFor(columns, rank.position) ?? columnFor(columns, percentile.position)
        if (!column) {
          warnings.push(`page ${pageIndex + 1}: no category column for ${instituteCode}/${branchCode}`)
          continue
        }
        const category = normalizeDteCategory(column.code)
        if (!category) {
          warnings.push(`page ${pageIndex + 1}: unknown category ${column.code}`)
          continue
        }
        if (!Number.isFinite(percentile.value) || percentile.value < 0 || percentile.value > 100) {
          warnings.push(`page ${pageIndex + 1}: percentile out of range ${percentile.value}`)
          continue
        }
        rows.push({
          instituteCode,
          collegeName,
          branchCode,
          branchName,
          level,
          seatType,
          stage: stageLabel,
          categoryCode: column.code,
          category,
          rank: Number.isInteger(rank.value) ? rank.value : null,
          percentile: Math.round(percentile.value * 1e7) / 1e7,
          page: pageIndex + 1,
        })
      }

      lineIndex = Math.max(lineIndex, cursor - 1)
    }
  }

  return finish()

  function finish(): DteParseResult {
    return {
      rows,
      warnings,
      pages: pages.length,
      institutes: institutes.size,
      branches: branches.size,
    }
  }
}

function parseHeaderColumns(line: string): Column[] {
  const stageIndex = line.indexOf('Stage')
  if (stageIndex < 0) return []
  const rest = line.slice(stageIndex + 'Stage'.length)
  const columns: Column[] = []
  for (const match of rest.matchAll(/[A-Z][A-Z0-9]+/g)) {
    columns.push({ code: match[0], start: stageIndex + 'Stage'.length + (match.index ?? 0) })
  }
  return columns
}

function numbersWithPositions(line: string, offset: number, percentile: boolean) {
  const pattern = percentile ? /\(\s*(\d+(?:\.\d+)?)\s*\)/g : /\d+/g
  const values: Array<{ value: number; position: number }> = []
  for (const match of line.matchAll(pattern)) {
    values.push({
      value: Number(match[1] ?? match[0]),
      position: offset + (match.index ?? 0),
    })
  }
  return values
}

function columnFor(columns: Column[], position: number): Column | null {
  for (let index = 0; index < columns.length; index++) {
    const current = columns[index]
    const next = columns[index + 1]
    if (position >= current.start - 6 && (!next || position < next.start - 6)) return current
  }
  return null
}
