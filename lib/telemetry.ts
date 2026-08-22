import { prisma } from '@/lib/prisma'

// ponytail: best-effort telemetry — analytics must never break the request it rides on
export function logEvent(type: string, label: string, value = 0): void {
  prisma.analyticsEvent.create({ data: { type, label, value } }).catch(() => {})
}
