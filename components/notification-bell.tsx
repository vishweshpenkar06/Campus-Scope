'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, BellRing } from 'lucide-react'

type Notification = {
  id: number
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

// ponytail: 60s polling instead of SSE/websockets — "live" enough for admission notices at zero infra cost
const POLL_MS = 60_000

export function NotificationBell() {
  const { status } = useSession()
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/notifications')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body) => {
        setItems(body.data)
        setUnread(body.unreadCount)
      })
      .catch(() => {})
  }, [status])

  useEffect(load, [load])

  useEffect(() => {
    if (status !== 'authenticated') return
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [status, load])

  useEffect(() => {
    if (!open) return
    const onClickAway = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [open])

  if (status !== 'authenticated') return null

  async function markAllRead() {
    setItems((cur) => cur.map((n) => ({ ...n, read: true })))
    setUnread(0)
    await fetch('/api/user/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {})
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative rounded-lg p-2 text-muted-foreground transition hover:text-foreground"
      >
        {unread > 0 ? <BellRing className="size-5 text-primary" /> : <Bell className="size-5" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <aside className="absolute right-0 top-12 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">Nothing yet — save colleges to get alerts.</p>
          ) : (
            <ul className="grid gap-1.5">
              {items.map((n) => (
                <li key={n.id} className={`rounded-lg border p-2.5 ${n.read ? 'border-border bg-background' : 'border-primary/25 bg-primary/5'}`}>
                  <p className="text-sm font-medium leading-snug">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/60">
                    {n.type} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </div>
  )
}
