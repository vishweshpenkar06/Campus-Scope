import { normalizeCollegeName } from './normalize'

export type MatchableCollege = { id: number; name: string; location?: string }
export type CollegeMatch<T extends MatchableCollege> = { college: T; score: number }

export const MATCH_THRESHOLD = 0.72

function tokenSet(value: string): Set<string> {
  return new Set(normalizeCollegeName(value).split(' ').filter(Boolean))
}

function jaccard(a: string, b: string): number {
  const left = tokenSet(a)
  const right = tokenSet(b)
  if (!left.size || !right.size) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared++
  return shared / (left.size + right.size - shared)
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = current
  }
  return previous[b.length]
}

export function nameSimilarity(a: string, b: string): number {
  const left = normalizeCollegeName(a)
  const right = normalizeCollegeName(b)
  if (!left || !right) return 0
  if (left === right) return 1
  // official names often carry a campus/location suffix the catalog omits
  if (left.startsWith(`${right} `) || right.startsWith(`${left} `)) return 0.9
  const edit = 1 - levenshtein(left, right) / Math.max(left.length, right.length)
  return Math.round(Math.max(jaccard(a, b), edit) * 1000) / 1000
}

export function matchCollege<T extends MatchableCollege>(
  name: string,
  colleges: T[],
  threshold = MATCH_THRESHOLD
): CollegeMatch<T> | null {
  let best: CollegeMatch<T> | null = null
  for (const college of colleges) {
    const score = nameSimilarity(name, college.name)
    if (score < threshold) continue
    if (!best || score > best.score || (score === best.score && college.id < best.college.id)) {
      best = { college, score }
    }
  }
  return best
}
