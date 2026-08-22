'use client'
import { createContext, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type CompareItem = { id: number; name: string; location: string; rating: number }
type CompareContextValue = {
  items: CompareItem[]
  toggle: (item: CompareItem) => void
  remove: (id: number) => void
  go: () => void
}
const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])
  const router = useRouter()
  const value = useMemo(
    () => ({
      items,
      toggle: (item: CompareItem) =>
        setItems((current) =>
          current.some((x) => x.id === item.id)
            ? current.filter((x) => x.id !== item.id)
            : current.length >= 3
              ? current
              : [...current, item]
        ),
      remove: (id: number) => setItems((current) => current.filter((x) => x.id !== id)),
      go: () => {
        if (items.length >= 2) router.push(`/compare?ids=${items.map((x) => x.id).join(',')}`)
      },
    }),
    [items, router]
  )
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const value = useContext(CompareContext)
  if (!value) throw new Error('useCompare must be used within CompareProvider')
  return value
}
