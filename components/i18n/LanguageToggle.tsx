'use client'

import { useEffect } from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from './use-language'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  useEffect(() => {
    document.documentElement.lang = lang === 'mr' ? 'mr' : 'en'
  }, [lang])

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
      aria-label={`Toggle language: ${lang === 'en' ? 'English' : 'मराठी'}`}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-foreground/15 px-2.5 text-xs font-semibold transition hover:border-primary hover:text-primary"
    >
      <Languages className="size-4" />
      {lang === 'en' ? 'English' : 'मराठी'}
    </button>
  )
}
