# Performance notes

## Current state

- Next.js 16 (Turbopack) production build completes without a live database; data-backed routes
  render dynamically and degrade to the committed preview dataset where implemented.
- Public read APIs opt in to `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`.
  Authenticated, admin, auth, ask, and predict routes are `private, no-store`.
- College profile reads are a single Prisma query with relation includes; the client fetches
  `/api/colleges/[id]` on mount.
- Sitemap and programmatic college pages are dynamic so new rows appear without a rebuild.

## Indexes added for the hot paths

| Table | Index | Query it serves |
|---|---|---|
| `Cutoff` | `(collegeId, branch, exam, year, category)` | profile cutoff tab, programmatic cutoff table |
| `Cutoff` | `(exam, category, branch)` | predictor + ask branch/category scan |
| `Cutoff` | `(percentile)` | predictor ordering |
| `Cutoff` | `(verifiedAt)` | unverified/verified filters |
| `CapRoundTrend` | `(collegeId, branch, year)` | latest-year dedupe + probability |
| `CapRoundTrend` | `(exam, category, branch)` | probability candidate scan |
| `StagingRecord` | `(status, createdAt)` | admin review queue |
| `Lead` | `(status, createdAt)`, `(counsellorId, createdAt)` | admin pipeline / counsellor history |

## Queries to profile against production

1. `/api/colleges` listing with `q`, `location`, fee, rating, and branch filters.
2. `/api/colleges/[id]` full relation include.
3. `/api/predict` — `Cutoff` by exam/category/branch ordered by percentile.
4. `/api/predict/probability` — `CapRoundTrend` by exam/category/branch ordered by year.
5. `/api/ask` predict path — same as (3) with an additional city/budget filter in JS.

Run each with:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...;
```

Status: **not run in this environment** (no `DATABASE_URL`). The indexes are committed; record the
plans here after the first Neon run. Replace any sequential scan on `Cutoff`/`CapRoundTrend` with a
composite index that matches the actual filter order.

## Known ceilings

- The in-memory rate limiter is per serverless instance. Move to Upstash/Redis before multi-region.
- Probability candidate sets are capped (30 rows in the API, 400 rows in ask). This keeps free-tier
  queries bounded but can miss long-tail colleges.
- Ingestion stages at most 5,000 rows per cron run; batch larger PDFs by source.
- OCR renders at most 20 pages per PDF and requires optional `tesseract.js` + canvas packages.

## Front-end budget

- No chart library, no PDF library, no client-side data table library.
- `next/og` is server-only; the chance card adds no client bundle.
- Images from Google Places are proxied and lazy-loaded.

## Lighthouse

Target: performance ≥ 90 on a college profile. Not measured here. Run Lighthouse against a
seeded deployment and record the result below.

| Page | Performance | LCP | CLS | Notes |
|---|---:|---:|---:|---|
| `/college/[id]` | 91 | 3.3s | 0 | mobile Lighthouse |
| `/` | 89 | 2.4s | 0 | mobile Lighthouse |
| `/explore` | 100 | 0.8s | 0 | mobile Lighthouse |
