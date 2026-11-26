export type LocalSavedCollege = {
  id: number
  name: string
  location: string
  branch: string
  category: string
  status: string
  createdAt: string
}

const KEY = 'campusscope-local-shortlist'

export function getLocalShortlist(): LocalSavedCollege[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as LocalSavedCollege[]) : []
  } catch {
    return []
  }
}

export function addLocalCollege(college: Omit<LocalSavedCollege, 'createdAt' | 'status'>): void {
  const list = getLocalShortlist()
  if (list.some((item) => item.id === college.id)) return
  localStorage.setItem(
    KEY,
    JSON.stringify([{ ...college, status: 'Researching', createdAt: new Date().toISOString() }, ...list].slice(0, 30))
  )
}

export function removeLocalCollege(id: number): void {
  localStorage.setItem(KEY, JSON.stringify(getLocalShortlist().filter((item) => item.id !== id)))
}

export function setLocalCollegeStatus(id: number, status: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(getLocalShortlist().map((item) => (item.id === id ? { ...item, status } : item)))
  )
}
