# Deployment checklist — Vercel + Neon

Use this once per environment. The app builds without a database, but every data feature needs
`DATABASE_URL`; auth needs `AUTH_SECRET` and Google OAuth keys.

## 1. Neon

1. Create a Neon project and database.
2. Copy the **pooled** connection string (host contains `-pooler`).
3. Append `?sslmode=require` if Neon did not include it.
4. For serverless, keep the pool small: `&connection_limit=1` is a safe starting point.

## 2. Environment variables

Set these in Vercel → Project → Settings → Environment Variables.
Use separate values for Preview and Production.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled URL |
| `AUTH_SECRET` | yes | `openssl rand -base64 32`; must be stable |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | for sign-in | Google Cloud OAuth client |
| `ADMIN_EMAILS` | for admin | comma-separated Google emails |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://your-domain.com` (sitemap/share cards) |
| `CRON_SECRET` | for cron | long random string; Vercel Cron sends it as Bearer |
| `RESEND_API_KEY` / `RESEND_FROM` | for lead email | without it, leads stay in DB and log a routing notice |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | optional | ask-engine slot extraction |
| `CAMPUSLM_URL` / `CAMPUSLM_MODEL` / `CAMPUSLM_API_KEY` | optional | first provider in the ask chain |
| `SENTRY_DSN` | optional | server error/performance capture |
| `GOOGLE_PLACES_API_KEY` | optional | photos, ratings, landmarks |
| `GOOGLE_MAPS_API_KEY` | optional | commute estimates |
| `DTE_CUTOFF_URL` / `INGEST_SOURCE` | optional | scheduled ingestion |
| `PLAYWRIGHT_*` | no | CI only |

## 3. Google OAuth

Authorised redirect URI:

- Production: `https://your-domain.com/api/auth/callback/google`
- Local: `http://localhost:3000/api/auth/callback/google`

Without Google keys the app still works; sign-in, shortlist, mentor booking, and lead attribution
are hidden/disabled.

## 4. Database migration

From a machine with the production `DATABASE_URL`:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate          # prisma migrate deploy — fresh or versioned database
```

Then import the official dataset from a machine with `poppler-utils` installed:

```bash
pnpm ingest:dte
pnpm ingest:seats
```

This downloads the official DTE / State CET Cell CAP PDFs for 2023–2026, parses them with
`pdftotext -layout`, and imports ~353k sourced cutoff rows across ~402 institutes and 28 documents.
It never publishes fee/placement/review data, and every cutoff keeps its source URL and page.

Do **not** run `pnpm seed` in production: it is a destructive demo dataset (the script refuses
unless `ALLOW_DESTRUCTIVE_SEED=1`). If the database was created earlier with `prisma db push`, use:

```bash
pnpm db:push
pnpm backfill:provenance
```

Verify provenance:

```sql
SELECT "sourceName", count(*) FROM "Cutoff" GROUP BY 1;
```

Existing/demo rows must show `legacy` / `0.5`, never verified.

## 5. Vercel

1. Import the GitHub repo. Framework preset: Next.js.
2. Add the environment variables above to Production (and Preview if used).
3. Deploy.
4. Confirm the build log shows `prisma generate` (postinstall) and `next build`.
5. Set the custom domain and update `NEXT_PUBLIC_SITE_URL` if it changed; redeploy.

`vercel.json` schedules `/api/cron/sync-cutoffs` daily. Vercel sends
`Authorization: Bearer $CRON_SECRET`; keep `CRON_SECRET` set or the route returns 402.

## 6. Post-deploy smoke test

```bash
curl -s https://your-domain.com/api/health
curl -s 'https://your-domain.com/api/health?deep=1'
curl -s 'https://your-domain.com/api/colleges?page=1&pageSize=2'
curl -s -X POST https://your-domain.com/api/predict \
  -H 'content-type: application/json' \
  -d '{"percentile":88,"category":"OPEN","branch":"Computer Engineering","exam":"CET"}'
curl -s -X POST https://your-domain.com/api/ask \
  -H 'content-type: application/json' \
  -d '{"query":"85 percentile CS Pune"}'
curl -sI https://your-domain.com/college/1
curl -s https://your-domain.com/sitemap.xml | grep -c '<loc>'
# data trust
open https://your-domain.com/methodology
```

Open in a browser:

- `/` and `/explore` → data loads; source badges/freshness visible on profiles.
- `/predictor` → results with a verified/unverified badge.
- `/counsellors` → directory (seeded only if you chose to seed).
- `/admin/ingest` and `/admin/leads` → sign in with an `ADMIN_EMAILS` address.
- `/api/share-card/<id>?percentile=88&category=OPEN` → PNG 1080×1350.

Security checks:

- `/admin/*` and `/api/admin/*` reject non-admin sessions.
- `/api/leads` rate-limits at 5/min per IP.
- `/api/cron/sync-cutoffs` returns 402 without the bearer secret.
- Response headers include CSP, HSTS, `X-Content-Type-Options`.

## 7. Cron and ingestion

- Daily sync stages rows; it never publishes. Review at `/admin/ingest`.
- For a real source, activate a `DataSource` with an official URL, or run
  `pnpm ingest --source dte-2025 --url <official PDF/HTML URL>`.
- Fixture sources are marked inactive and cannot be picked up by cron.

## 8. Observability

- Set `SENTRY_DSN`; `instrumentation.ts` initialises `@sentry/nextjs` with PII disabled.
- Watch `/api/health?deep=1` for database reachability.
- Add Vercel Analytics/Speed Insights only if you accept the extra client script; check the CSP
  `connect-src` when enabling.

## 9. Known limits before scale

- Rate limiting is in-memory per serverless instance. Move to Upstash/Redis before multi-region or
  abusive traffic.
- Probability/ask queries are capped (30/400 rows) to stay inside free-tier limits.
- Seeded `legacy` rows are unverified by design; do not present them as official cutoffs.
- OCR requires optional `tesseract.js` + `@napi-rs/canvas`; the base install cannot OCR scans.
- Lighthouse/backtest/ask-eval should be re-run against real production data, not the demo seed.

## 10. Rollback

1. Vercel → Deployments → Promote the previous healthy deployment.
2. Database migrations are forward-only in this repo; restore from a Neon branch/snapshot if a
   schema change must be reverted.
3. Keep `AUTH_SECRET` unchanged during rollback so sessions remain valid.
