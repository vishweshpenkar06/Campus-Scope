# Deployment

The supported production path is **Vercel + Neon Postgres**. Follow the full checklist in
[DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) for environment variables, migrations, official data
ingestion, OAuth redirects, cron, and smoke tests.

Quick version:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate                 # prisma migrate deploy against Neon
pnpm ingest:dte                 # official DTE cutoffs 2023–2026 (~354k rows, CET + JEE)
pnpm build
```

Set the values from [FREE-KEYS.md](FREE-KEYS.md) in Vercel. Do not run `pnpm seed` in production.
