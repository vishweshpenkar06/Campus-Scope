'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquareHeart, Send } from 'lucide-react'
import { AuthButton } from './auth-button'

const templates = [
  'How strictly is the 75% attendance rule enforced in my branch?',
  'What is the actual hostel mess food quality?',
  'How accessible is the campus from the nearest station?',
  'What does placement season really look like for average students?',
]

export function AskSenior({ collegeId, branches }: { collegeId: number; branches: string[] }) {
  const [branch, setBranch] = useState(branches[0] ?? '')
  const [notes, setNotes] = useState(templates[0])
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'unauthorized' | 'error'>('idle')

  async function send() {
    setState('sending')
    const res = await fetch('/api/peer-connect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collegeId, targetBranch: branch, notes }),
    })
    if (res.status === 401) setState('unauthorized')
    else if (res.ok) setState('sent')
    else setState('error')
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="size-4 text-primary" />
        <h3 className="font-serif text-xl font-semibold">Ask a Senior</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Send your question to verified current students and alumni of this college.
      </p>

      {state === 'sent' ? (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
          Request sent — a senior will get back to you here once connected.
        </div>
      ) : state === 'unauthorized' ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm font-medium">Sign in to connect with seniors</p>
          <div className="mt-3 flex justify-center"><AuthButton /></div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Target branch
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case">
                {branches.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Your question
              <select
                value={templates.includes(notes) ? notes : '__custom'}
                onChange={(e) => e.target.value !== '__custom' && setNotes(e.target.value)}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm font-normal normal-case"
                aria-label="Question templates"
              >
                {templates.map((t) => <option key={t}>{t}</option>)}
                <option value="__custom">Custom question…</option>
              </select>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Type your own question…"
                className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case"
              />
            </label>
            <button
              onClick={send}
              disabled={state === 'sending' || notes.trim().length < 3}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Send className="size-4" />
              Send request
            </button>
            {state === 'error' && (
              <p role="alert" className="text-sm text-destructive">Could not send that request. Try again.</p>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Questions go through moderation before connecting.{' '}
            <Link href="/shortlist" className="font-semibold text-primary underline-offset-4 hover:underline">
              Track requests in your portal
            </Link>
            .
          </p>
        </>
      )}
    </div>
  )
}
