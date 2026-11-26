const CODE_KEY = 'campusscope-referral-code'
const SOURCE_KEY = 'campusscope-referral-source'

export function getReferralCode(): string {
  if (typeof window === 'undefined') return 'campusscope'
  const existing = localStorage.getItem(CODE_KEY)
  if (existing) return existing
  const code = `CS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  localStorage.setItem(CODE_KEY, code)
  return code
}

export function recordReferral(): { code: string; source: string | null } {
  const code = getReferralCode()
  if (typeof window === 'undefined') return { code, source: null }
  const source = new URLSearchParams(window.location.search).get('ref')
  if (source && source !== code) {
    localStorage.setItem(SOURCE_KEY, source.slice(0, 60))
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'referral', label: source.slice(0, 60), value: 1 }),
    }).catch(() => {})
  }
  return { code, source: localStorage.getItem(SOURCE_KEY) }
}
