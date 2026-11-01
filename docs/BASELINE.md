# Baseline audit — 1 Nov 2026

## Environment

- Node `v22.23.1`, npm `10.9.8`.
- `pnpm` was not on PATH in the audit shell. Installed locally under
  `~/.local/share/pnpm-cli` (pnpm `10.34.9`); repo scripts are unchanged.
- No `.env` present, so no live Postgres was reachable during this audit.
  `.env.example` documents `DATABASE_URL`, auth, Google Places, and `CRON_SECRET`.

## Verified commands

| Command | Result |
|---|---|
| `pnpm install` | pass |
| `pnpm verify` (`tsc --noEmit`, selfcheck, Vitest) | pass — 4 selfcheck suites, 1 Vitest file |
| `pnpm build` | pass — 34 routes generated |

## Inventory

- **Prisma models:** 25 (`College`, `Cutoff`, `CapRoundTrend`, `SeatMatrix`,
  `Placement`, auth tables, forum, mentors, analytics).
- **App routes:** 33 (`app/**/route.ts` + `page.tsx`).
- **Prediction:** `lib/predict-core.ts` (classify / dedupe / score) and
  `lib/probability.ts` (single-parameter logistic, monotonic rounds, OTH penalty).
- **Fallback:** `lib/demo-data.ts` used when Prisma is unreachable by the
  college list/detail APIs.
- **Tests:** `scripts/selfcheck.ts` (assert-based) and
  `lib/example.test.ts` (Vitest).

## Trust gaps found

1. `lib/cron-sync.ts` mutates cutoffs with `Math.random()` and creates random
   spot-round vacancies. It runs from `/api/cron/sync-cutoffs`.
2. No model stores provenance (source URL/name/date, verification, confidence)
   or staged, human-reviewed ingestion records.
3. Prediction/probability endpoints return percentages without a citation
   payload.
4. No backtest, no model version, no calibration report.
5. No CI workflow, no committed Playwright specs, no sitemap/robots.
6. `prisma/seed.ts` generates cutoff values deterministically from seeded
   RNG-like formulas, but the values are demo data, not official cutoffs.

## Baseline acceptance

- `pnpm verify` green.
- `pnpm build` green.
- No pre-existing failures were suppressed or skipped to reach this baseline.

## Constraints carried into the build

- No live database, DTE PDF, or API keys were available in the audit
  environment. Data-dependent acceptance items are implemented with fixtures
  and must be re-run against a real source and Neon database before launch.
- Every published number must keep a source. Fixture rows used by ingestion
  tests are labelled `fixture` and are never published by seed or cron.
