'use client'

import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import type { AdmissionQuery } from '@/lib/ai/query'
import { BRANCHES } from '@/lib/branches'

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'TFWS', 'VJ/NT', 'SEBC', 'PWD', 'DEF', 'ORPHAN', 'JKM']

type EditableKey = 'percentile' | 'exam' | 'category' | 'branch' | 'city' | 'budget' | 'homeUniversity'

const LABELS: Record<EditableKey, string> = {
  percentile: 'Percentile',
  exam: 'Exam',
  category: 'Category',
  branch: 'Branch',
  city: 'City',
  budget: 'Budget',
  homeUniversity: 'Quota',
}

function display(key: EditableKey, query: AdmissionQuery): string | null {
  if (key === 'homeUniversity') {
    if (query.homeUniversity === undefined) return null
    return query.homeUniversity ? 'Home university' : 'Other than home'
  }
  const value = query[key]
  if (value === undefined || value === null || value === '') return null
  if (key === 'budget') return `₹${Number(value).toLocaleString('en-IN')}`
  return String(value)
}

export function UnderstoodChips({
  query,
  onChange,
}: {
  query: AdmissionQuery
  onChange: (query: AdmissionQuery) => void
}) {
  const [editing, setEditing] = useState<EditableKey | null>(null)
  const keys = (Object.keys(LABELS) as EditableKey[]).filter((key) => display(key, query) !== null)
  if (!keys.length) return null

  function commit(key: EditableKey, value: string) {
    const next = { ...query }
    if (key === 'percentile') next.percentile = value === '' ? undefined : Number(value)
    else if (key === 'budget') next.budget = value === '' ? undefined : Number(value)
    else if (key === 'homeUniversity') next.homeUniversity = value === 'true'
    else if (key === 'exam') next.exam = value === 'JEE' ? 'JEE' : 'MHT-CET'
    else if (key === 'category') next.category = value || undefined
    else if (key === 'branch') next.branch = value || undefined
    else if (key === 'city') next.city = value || undefined
    setEditing(null)
    onChange(next)
  }

  function clear(key: EditableKey) {
    const next = { ...query }
    delete next[key]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Understood</span>
      {keys.map((key) => {
        const value = display(key, query)!
        if (editing === key) {
          return (
            <span key={key} className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/5 px-2 py-1">
              {key === 'category' ? (
                <select
                  autoFocus
                  defaultValue={query.category}
                  onChange={(event) => commit(key, event.target.value)}
                  className="bg-transparent text-xs font-medium outline-none"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              ) : key === 'branch' ? (
                <select
                  autoFocus
                  defaultValue={query.branch}
                  onChange={(event) => commit(key, event.target.value)}
                  className="bg-transparent text-xs font-medium outline-none"
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch}>{branch}</option>
                  ))}
                </select>
              ) : key === 'exam' ? (
                <select
                  autoFocus
                  defaultValue={query.exam}
                  onChange={(event) => commit(key, event.target.value)}
                  className="bg-transparent text-xs font-medium outline-none"
                >
                  <option value="MHT-CET">MHT-CET</option>
                  <option value="JEE">JEE</option>
                </select>
              ) : key === 'homeUniversity' ? (
                <select
                  autoFocus
                  defaultValue={String(query.homeUniversity)}
                  onChange={(event) => commit(key, event.target.value)}
                  className="bg-transparent text-xs font-medium outline-none"
                >
                  <option value="true">Home university</option>
                  <option value="false">Other than home</option>
                </select>
              ) : (
                <input
                  autoFocus
                  type={key === 'percentile' || key === 'budget' ? 'number' : 'text'}
                  defaultValue={String(query[key] ?? '')}
                  onBlur={(event) => commit(key, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commit(key, event.currentTarget.value)
                    if (event.key === 'Escape') setEditing(null)
                  }}
                  className="w-24 bg-transparent text-xs font-medium outline-none"
                />
              )}
            </span>
          )
        }
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-2.5 pr-1 text-xs"
          >
            <button
              type="button"
              onClick={() => setEditing(key)}
              className="inline-flex items-center gap-1 font-medium hover:text-primary"
              title={`Edit ${LABELS[key].toLowerCase()}`}
            >
              <Pencil className="size-2.5 opacity-60" />
              {LABELS[key]}: {value}
            </button>
            <button
              type="button"
              onClick={() => clear(key)}
              aria-label={`Remove ${LABELS[key]}`}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
