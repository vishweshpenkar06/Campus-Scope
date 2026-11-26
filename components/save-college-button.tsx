'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, Check } from 'lucide-react'
import { addLocalCollege, removeLocalCollege } from '@/lib/local-shortlist'

export function SaveCollegeButton({
  collegeId,
  collegeName,
  location,
  branches,
}: {
  collegeId: number
  collegeName: string
  location: string
  branches: string[]
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'local' | 'error'>('idle')

  async function save() {
    setState('saving')
    try {
      const res = await fetch('/api/user/shortlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collegeId,
          targetBranch: branches[0] ?? 'Any branch',
          category: 'OPEN',
        }),
      })
      if (res.status === 401) {
        addLocalCollege({
          id: collegeId,
          name: collegeName,
          location,
          branch: branches[0] ?? 'Any branch',
          category: 'OPEN',
        })
        setState('local')
        return
      }
      if (!res.ok) throw new Error()
      removeLocalCollege(collegeId)
      setState('saved')
    } catch {
      setState('error')
    }
  }

  if (state === 'saved' || state === 'local')
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
        <Check className="size-4" />
        {state === 'saved' ? 'Saved' : 'Saved on this device'} —{' '}
        <Link href="/shortlist" className="underline underline-offset-4">
          view shortlist
        </Link>
      </span>
    )

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        onClick={save}
        disabled={state === 'saving'}
        className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
      >
        <BookmarkPlus className="size-4" />
        {state === 'saving' ? 'Saving…' : 'Save to shortlist'}
      </button>
      {state === 'error' && (
        <>
          <span className="text-xs text-muted-foreground">Something went wrong.</span>
          <button onClick={() => setState('idle')} className="text-xs font-semibold text-primary underline underline-offset-4">
            Retry
          </button>
        </>
      )}
    </span>
  )
}
