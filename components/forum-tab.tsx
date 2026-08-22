'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowBigUp, MessageSquare, Plus, ShieldCheck } from 'lucide-react'
import { AuthButton } from './auth-button'

type Post = {
  id: number
  title: string
  content: string
  upvotes: number
  createdAt: string
  authorName: string
  senior: boolean
  commentCount: number
  votedByMe: boolean
}

type Comment = { id: number; content: string; createdAt: string; authorName: string; senior: boolean }

function SeniorBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
      <ShieldCheck className="size-3" /> Verified senior
    </span>
  )
}

export function ForumTab({ collegeId }: { collegeId: number }) {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [openPost, setOpenPost] = useState<number | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/notifications')
      .then((r) => setSignedIn(r.status !== 401))
      .catch(() => setSignedIn(false))
  }, [])

  const load = useCallback(() => {
    fetch(`/api/forum?collegeId=${collegeId}&sort=${sort}`)
      .then((r) => r.json())
      .then((body) => setPosts(body.data))
      .catch(() => setPosts([]))
  }, [collegeId, sort])

  useEffect(load, [load])

  function toggleSort(next: 'new' | 'top') {
    setSort(next)
    setPosts(null)
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collegeId, title, content }),
    })
    if (res.status === 401) return setSignedIn(false)
    if (!res.ok) return setError('Could not post that question.')
    setTitle('')
    setContent('')
    setComposing(false)
    load()
  }

  async function upvote(post: Post) {
    if (signedIn === false) return setError('Sign in to upvote.')
    // optimistic flip
    setPosts((cur) =>
      cur?.map((p) => (p.id === post.id ? { ...p, upvotes: p.upvotes + (p.votedByMe ? -1 : 1), votedByMe: !p.votedByMe } : p)) ?? cur
    )
    const res = await fetch('/api/forum/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ postId: post.id }),
    })
    if (!res.ok) load()
    else {
      const body = await res.json()
      setPosts((cur) => cur?.map((p) => (p.id === post.id ? { ...p, upvotes: body.data.upvotes, votedByMe: body.data.voted } : p)) ?? cur)
    }
  }

  async function openComments(postId: number) {
    if (openPost === postId) return setOpenPost(null)
    setOpenPost(postId)
    setComments([])
    const res = await fetch(`/api/forum/${postId}`)
    if (res.ok) {
      const body = await res.json()
      setComments(body.data.comments)
    }
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (openPost === null || reply.trim().length < 3) return
    const res = await fetch(`/api/forum/${openPost}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: reply }),
    })
    if (res.status === 401) return setSignedIn(false)
    if (!res.ok) return setError('Could not post that reply.')
    const body = await res.json()
    setComments((cur) => [...cur, body.data])
    setReply('')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['new', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => toggleSort(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${sort === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'new' ? 'Newest' : 'Most upvoted'}
            </button>
          ))}
        </div>
        {signedIn ? (
          <button
            onClick={() => setComposing((c) => !c)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Ask a question
          </button>
        ) : (
          signedIn === false && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              Sign in to ask or vote. <AuthButton />
            </span>
          )
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

      {composing && (
        <form onSubmit={submitQuestion} className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "Is TFWS applicable for ACAP rounds?"'
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
            maxLength={150}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add context — percentile, category, round…"
            rows={3}
            maxLength={2000}
            className="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button className="h-10 w-fit rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Post question
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-3">
        {posts === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading questions…</p>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 font-semibold">No questions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to ask this college&apos;s seniors something specific.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <button
                  onClick={() => upvote(post)}
                  aria-label={post.votedByMe ? 'Retract upvote' : 'Upvote'}
                  className={`flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5 transition ${
                    post.votedByMe ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <ArrowBigUp className={`size-4 ${post.votedByMe ? 'fill-primary' : ''}`} />
                  <span className="text-xs font-bold tabular-nums">{post.upvotes}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{post.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.authorName}</span>
                    {post.senior && <SeniorBadge />}
                    <button onClick={() => openComments(post.id)} className="font-semibold text-primary underline-offset-4 hover:underline">
                      {post.commentCount} repl{post.commentCount === 1 ? 'y' : 'ies'}
                    </button>
                  </div>

                  {openPost === post.id && (
                    <div className="mt-3 grid gap-2 border-l-2 border-border pl-3">
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No replies yet.</p>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="rounded-lg bg-background p-2.5 text-sm">
                            <p className="flex items-center gap-1.5 text-xs font-semibold">
                              {c.authorName} {c.senior && <SeniorBadge />}
                            </p>
                            <p className="mt-1 leading-6 text-muted-foreground">{c.content}</p>
                          </div>
                        ))
                      )}
                      <form onSubmit={submitReply} className="mt-1 flex gap-2">
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Write a reply…"
                          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                        />
                        <button className="h-9 rounded-lg border border-border px-3 text-xs font-semibold hover:border-primary hover:text-primary">
                          Reply
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
