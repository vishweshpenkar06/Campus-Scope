'use client'

import Link from 'next/link'
import { useLanguage } from './use-language'

export function PredictorIntro() {
  const { t } = useLanguage()
  return (
    <div className="mb-10 border-b border-foreground/10 pb-6">
      <p className="eyebrow">02 · {t('shortlist')}</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">{t('predictorTitle')}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        {t('predictorText')}{' '}
        <Link href="/guides/how-cap-rounds-work" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t('guides')} →
        </Link>
      </p>
    </div>
  )
}
