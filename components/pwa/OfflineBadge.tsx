'use client'

import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function OfflineBadge() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (online) return null

  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber-200 px-4 py-2 text-xs font-semibold text-amber-950">
      <WifiOff className="size-4" /> Offline — showing cached pages and guides only.
    </div>
  )
}
