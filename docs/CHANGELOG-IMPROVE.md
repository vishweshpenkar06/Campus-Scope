# CampusScope improvement log

One entry per phase. Every phase ends with `pnpm verify` and `pnpm build` green.

## Phase 0 — Baseline

- Added `docs/BASELINE.md`.
- Verified `pnpm install`, `pnpm verify` (4 selfcheck suites + Vitest), and `pnpm build` (34 routes).
- Recorded trust gaps: simulated cron drift, no provenance, no staging, no citations, no CI/E2E.

## Phase 1 — Provenance

- Added `DataSource` and `StagingRecord`; provenance fields on `College`, `Cutoff`,
  `CapRoundTrend`, `SeatMatrix`, and `Placement`.
- Added `lib/data/provenance.ts` (`isVerified`, `freshnessDays`, `isStale`,
  `assertPublishable`, `citationFor`, `canApprove`) with tests.
- Added `SourceBadge` and `FreshnessWarning` to the profile cutoff tab and predictor results.
- Predictor responses now include per-row provenance and de-duplicated citations.
- Added `scripts/backfill-provenance.ts` and `pnpm backfill:provenance`.
- Seed rows are explicitly `legacy`, `confidence: 0.5`, `verifiedAt: null`.

Acceptance note: a full initial SQL migration was generated at
`prisma/migrations/20261101000000_init/migration.sql` for a fresh database; existing databases
created with `db push` use `pnpm backfill:provenance`. A live DB was not available in the build
environment, so the migration and backfill were not executed against Postgres here.

## Phase 2 — Ingestion

- Added `scripts/ingest/{fetch,extract,ocr,run,sources,report}.ts`; pure normalization/matching/staging
  live in `lib/data/{normalize,match,staging}.ts` so they are testable without a DB.
- PDF text extraction uses `unpdf`; scanned PDFs use an optional `tesseract.js` +
  `@napi-rs/canvas` adapter that fails with install instructions when absent.
- Normalization covers categories, branch synonyms, rounds, exams, percentiles, and college-name
  noise; matching uses token Jaccard + edit distance (threshold 0.72).
- Staging is idempotent via `UNIQUE(sourceId, externalId)`. Every staged row records match score and
  a reason when unmatched.
- Admin review UI at `/admin/ingest` with approve/reject and an incoming-vs-existing diff.
- Admin API at `PATCH /api/admin/staging/[id]`; cron staging at `GET /api/cron/ingest`.
- Fixture result: **100 parsed, 100 valid, 95 matched (95.0%), 5 unmatched**, zero published.
- Approve/reject behavior is unit-tested with a fake Prisma transaction: approval writes a verified
  row with the registry URL; rejection only touches the staging row.

Acceptance note: no official DTE PDF was available offline. The committed 100-row fixture is
synthetic and labelled `fixture`; it must never be published. Approving a row writes provenance and
creating a row is idempotent, but the approve path was not exercised against a live database here.

## Phase 3 — Remove simulated sync

- Deleted `Math.random()` drift, random spot notices, and synthetic notification generation from
  `lib/cron-sync.ts`.
- Sync now selects an active `DataSource`, respects a 6-hour cooldown, fetches official bytes, and
  stages rows. No source → `{ staged: 0 }`.
- Added a Vitest guard that fails if `Math.random` appears in `lib/cron-sync.ts` or `lib/data/**`.

## Phase 4 — Probability + backtest

- `PROBABILITY_MODEL_VERSION = "logistic-1.1.0"`, exported `clearChance`, configurable spread/quota
  penalty, and `modelMetadata` / `probabilityAssumptions`.
- `/api/predict/probability` now returns `modelVersion`, `sampleSize`, per-row `citation`, and
  `verified`.
- Added 12 probability tests (boundary, monotonicity, missing spot, OTH penalty, ranges, metadata).
- Added `scripts/backtest.ts`; report at `docs/BACKTEST.md` + JSON.

Backtest proxy fixture: 272 rows, 1,761 observations, Brier **0.0694**, log loss **0.2657**.
This is a **synthetic proxy**, not official allotment data. Rerun `pnpm backtest --db` for the real
report.

## Phase 5 — Ask engine

- Added `lib/ai/{query,prompts,rules-parser}.ts` and `/api/ask`.
- Provider chain: CampusLM → Gemini → deterministic rules. LLMs only extract slots; deterministic
  code computes cutoffs/chances.
- Response includes `understood`, `answer`, `results`, `citations`, `assumptions`, `disclaimer`.
  Every result carries a citation; no catalog → cited degraded answer, no invented numbers.
- Added `AskBox`, editable `UnderstoodChips`, and `CitationCard` to `/` and `/predictor`.
- 100-query eval at `eval/ask/queries.jsonl`; results in `docs/ASK_EVAL.md`.
  Slot accuracy **1.0**, citation validity **1.0**, hallucinated cutoffs **0**.
- Caveat: the eval fixture was authored alongside the rules parser, so it over-represents the
  parser's supported phrasings. Expand it with real student paraphrases during the pilot.

## Phase 6 — Growth loop

- Added `CounsellorProfile`, `Lead`, and `Feedback` models.
- `/counsellors` directory + `/counsellors/[id]` profile and lead form.
- `/api/leads` rate-limits, stores the lead, and sends Resend email (console fallback, no PII logged).
- `/admin/leads` pipeline with status changes.
- `GET /api/share-card/[collegeId]` renders a 1080×1350 PNG via `next/og`; `ChanceCard` adds
  download + WhatsApp share to the profile cutoff tab.
- Seeded three demo counsellors.

Acceptance note: lead email and PNG were not verified against live Resend/DB; the console fallback
and image route compile and run. Admin status changes require `ADMIN_EMAILS` + auth.

## Phase 7 — Production quality

- Added `.github/workflows/ci.yml` with verify/build and a Postgres-backed Playwright job.
- Added `playwright.config.ts` and three specs: search/profile/predictor, ask/citations, option form.
- Added `app/sitemap.ts`, `app/robots.ts`, and `/colleges/[slug]` programmatic pages with JSON-LD.
- Added composite indexes on `Cutoff(collegeId, branch, exam, year, category)` and
  `CapRoundTrend(collegeId, branch, year)`.
- Added `docs/PERFORMANCE.md` with the query plan and EXPLAIN commands.
- Added optional Sentry server instrumentation (`instrumentation.ts`); enabled only when
  `SENTRY_DSN` is set. PII is disabled.

Acceptance note: Playwright was not run locally because no Postgres/`.env` was available. CI is set
up to create a Postgres service, push the schema, seed, and run the specs. Lighthouse was not run;
see `docs/PERFORMANCE.md`.

## Phase 8 — Pilot

- Added `FeedbackButton` in the app shell and `POST /api/feedback`.
- Added aggregate telemetry for `ask`, `lead`, `feedback`, and `share-card`.
- Added `docs/PILOT.md` with the target metrics, instrumentation, and a results template.

Acceptance note: 50 students / 20 shortlists / 100 asks / 5 leads require a deployed pilot and real
users; the instrumentation is in place but the numbers cannot be produced in this environment.

## Final verification

- `pnpm verify`: 45 tests + 4 selfcheck suites, green.
- `pnpm build`: green, including the new admin, ask, leads, feedback, share-card, counsellor,
  programmatic-college, sitemap, and robots routes.
- `pnpm ingest --dry-run`: 100 parsed / 95 matched.
- `pnpm backtest`: green; proxy report committed.
- `pnpm eval:ask`: targets met; reports committed.
