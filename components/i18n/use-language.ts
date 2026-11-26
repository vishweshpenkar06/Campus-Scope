'use client'

import { useSyncExternalStore } from 'react'
import { readLang, translate, writeLang, type Lang } from '@/lib/i18n'

function subscribe(callback: () => void) {
  window.addEventListener('campusscope:lang', callback)
  return () => window.removeEventListener('campusscope:lang', callback)
}

function getServerSnapshot(): Lang {
  return 'en'
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, readLang, getServerSnapshot)
  return { lang, t: (key: string) => translate(lang, key), setLang: writeLang }
}
