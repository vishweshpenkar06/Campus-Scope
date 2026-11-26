# QA results

Measured on a production `next start` build against a seeded PostgreSQL database, 18 Nov 2026.

## Lighthouse (mobile emulation)

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 89 | 100 | 100 | 100 | 2.4s | 0 |
| `/explore` | 100 | 100 | 100 | 100 | 0.8s | 0 |
| `/college/371` | 91 | 98 | 100 | 100 | 3.3s | 0 |

Target was ≥90 on a college profile; achieved 91. Home is 89 with the onboarding modal and lazy 3D orb in the initial load.

## Accessibility

`e2e/a11y.spec.ts` runs axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) on:

- `/`, `/explore`, `/predictor`, `/college/371`, `/methodology`, `/signin`

It fails on serious or critical violations. All pass. Earlier failures were low-contrast muted text and accessible-name/visible-label mismatches on comparison buttons; both were fixed.

## Reproduce

```bash
pnpm build
pnpm exec next start -p 3100
PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm e2e
CHROME_PATH=/path/to/chrome pnpm exec lighthouse http://localhost:3100/college/371 \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags='--headless --no-sandbox'
```

## Notes

- Profile pages are server-rendered with initial college data, so the hero photo is part of the LCP element instead of arriving after a client fetch.
- Wikimedia thumbnails are cached locally under `public/colleges/` via `pnpm photos:localize`.
- External images are optimized by Next; the container has a reserved aspect ratio, so CLS is zero.
