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

## Polish pass

- Fixed the preview-directory bug: `/api/colleges` returned `{}` because the demo fallback wrapped an
  existing `Response` in `Response.json`. Explore now renders demo cards instead of skeletons.
- Preview/no-DB mode is quiet: college list/detail/locations skip Prisma, mentors slots return an
  empty feed, Auth.js returns `null` session / `{}` providers, and admin auth fails closed. A crawl of
  every page returns no 500s and no auth console errors.
- Mobile navigation added (hamburger + full link list + Compare); desktop nav moved to `xl` so it
  never crowds a tablet. Home CTA now targets `#explore` when no recommendations exist.
- Accessibility: skip link, single `h1` per page, `aria-expanded`/`aria-controls` on the menu,
  `aria-live` Ask results, labelled feedback dialog with Escape close, reduced-motion CSS and
  reduced-motion-aware scrolling.
- Feedback launcher becomes icon-only on mobile; footer added with trust language and official CET
  Cell link.
- Centralized canonical `BRANCHES`, removing duplicate options in the explorer/onboarding.
- Fixed placement units: `Placement.avgPackage` is lakhs, demo data now matches seed, ROI callers
  convert to INR, and the SEO page no longer prints `₹3600000L/yr`.
- Explore search debounced 250 ms; dead `h1` in the explorer changed to `h2`.
- Migrated `middleware.ts` to Next 16 `proxy.ts`; global API limit raised to 120/min, auth exempt,
  and 429s return JSON with `Retry-After`.
- Replaced the removed `next lint` command with ESLint 9 flat config; `pnpm lint` now passes with
  0 errors and 0 warnings. Dynamic Google Places photos use `next/image`.
- Removed a redundant `Cache-Control` header for `/_next/static` that triggered a Next.js build
  warning; Next already ships immutable caching for hashed assets.

## Official data milestone

Replaced the seeded demo cutoffs with a real DTE Maharashtra pipeline:

- Downloaded 14 official CAP cutoff PDFs (2023–2026, rounds 1–4 where published).
- Built a flexible parser for 2023/2024/2025/2026 PDF layouts, including `I-Non PWD`, `I-Non Defence`,
  minority `MH` rows, gender (`G`/`L`), level (`H`/`O`/`S`), wrapped headers, and special categories.
- Imported **353,853 cutoff rows**, **402 DTE institutes**, **28 source documents**, and **61,123
  derived trend rows** with source URL, page, document hash, and verification timestamp.
- Added `SourceDocument`, `instituteCode`, `branchCode`, `categoryCode`, `rank`, `stage`, `level`,
  and `seatType`; removed fuzzy college matching in favor of official institute codes.
- Added `pnpm ingest:dte`, `--dry-run`, `--source`, `--skip-download`, and `docs/OFFICIAL-DATA.md`.
- Data QA: 0 rows missing source/out of range; duplicates down to 134 after level/section fixes.
- Added a 2026 seat-matrix parser: 2,262 branch rows with OPEN/OBC/SC/ST/TFWS and All-India seats.
- Added a lazy-loaded Three.js data constellation to the home page; it pauses offscreen, disposes WebGL
  resources, and renders a static frame for reduced-motion users.
- Added `/methodology` trust center, `/about`, `/privacy`, `/terms`, and a visible "Official DTE data"
  banner. Fees/placements/reviews are hidden or marked unverified until sourced.
- Predictor now returns a balanced Safe/Target/Reach mix; Ask does the same and no longer claims a
  reach is the "strongest" option.
- Added a public correction workflow: "Report an error" on the cutoff table, `/api/corrections`,
  and `/admin/corrections` with a review status queue.
- Added Upstash-backed rate limiting with an in-memory fallback and tests.
- Added live coverage stats (rows, institutes, years, PDFs) to the homepage and `/methodology`; the
  home page now presents 353,853 rows across 4 years and 28 source PDFs.
- Added `/about`, `/privacy`, and `/terms` beta pages, plus a trust banner on official profiles.
- Official profiles hide unverified fees/placements/reviews instead of showing ₹0 / 0.0.
- Search now matches DTE institute codes; branch filters use official cutoff branches.
- Rebuilt the backtest against the official dataset; added a year-over-year cutoff carry-forward
  metric (MAE/RMSE/bias/coverage) alongside Brier/log-loss calibration.

## QA and CI hardening

- Added axe-core E2E scans for six key pages; fixed low-contrast text and accessible-name mismatches.
- Server-rendered college profile data and localized Wikimedia thumbnails; Lighthouse college profile
  reached 91 performance / 98 accessibility / 100 best practices / 100 SEO (CLS 0).
- Added live college photos with attribution and clearly labelled illustrative fallbacks.
- Fixed CI: made `eslint` a direct dependency, moved unused `shadcn` CLI to devDependencies, bumped
  Next.js to 16.4.6 and Zod to 4.6.7 to clear critical advisories, and moved Actions to Node 22.
- Review fixes: dynamic college id in a11y tests, stable remount on route change, deduplicated Google
  Places fetching, and an SSRF host guard in the photo localizer.

## Localization

- Added English/Marathi core UI toggle for navigation, hero, predictor, and Ask labels.
- Language choice persists in localStorage and updates the document language attribute.
- Added `e2e/i18n.spec.ts`.

## AI model card and eval

- Added a versioned public model card with the logistic formula, assumptions, and limitations.
- Expanded the committed Ask eval to 120 queries, including a JEE slice; slot accuracy remains 100%.
- Added `e2e/model.spec.ts`.

## PWA foundation

- Replaced the corrupted static manifest with a Next.js manifest route and added metadata links.
- Added a versioned service worker that caches the app shell and static assets, keeps API/admin responses uncached, and serves cached pages offline.
- Added an offline status badge and `e2e/pwa.spec.ts`.

## SEO and content

- Added five educational guides: CAP rounds, option forms, home-university quota, cutoffs, and categories/documents.
- Added FAQPage + Article JSON-LD, metadata/canonical URLs, guide index, sitemap entries, and internal links from predictor/footer.
- Added `e2e/seo.spec.ts` for structured data and sitemap coverage.

## Growth loop

- Added an anonymous local shortlist: students can save colleges without an account and sign in later to sync.
- Added free alert opt-ins for deadlines, cutoffs, and spot rounds via email or WhatsApp, with explicit consent and unsubscribe.
- Added a daily authenticated alert-digest cron and aggregate analytics for opt-ins/referrals.
- Added referral codes in share-card WhatsApp links and `e2e/growth.spec.ts`.
- Added `/admin/feedback` inbox and alert/referral panels in admin analytics.

## Deployment readiness

Verified against a real local PostgreSQL 16 instance (podman), not just fixtures:

- `prisma migrate deploy` applied the initial migration to a fresh DB; `prisma migrate status` reports
  up to date and `migrate diff` against the schema is empty.
- `pnpm seed` created 34 colleges, 2,700 cutoff rows, 1,010 trends, seat matrices, placements,
  mentors/forum, and 3 counsellors. Legacy provenance is `legacy` / `0.5` / unverified.
- Ingestion staged 100 fixture rows; a matched row was approved through `applyStagingRecord` and
  wrote a verified cutoff with provenance; a rejected row only changed its staging status.
- `/api/predict`, `/api/predict/probability`, `/api/ask`, `/api/leads`, `/api/feedback`, `/api/health`,
  and the share-card PNG were exercised against the seeded DB.
- `pnpm backtest --db` completed against 1,010 trend rows (fixture report kept in docs).
- Production `next build` + `next start` passed all 4 Playwright specs against the seeded DB.

Hardening added:

- CSP widened for Google images/maps/Sentry, HSTS, `object-src 'none'`, base/form restrictions;
  `unsafe-eval` is development-only.
- Auth.js `trustHost`; `/api/health?deep=1` checks DB reachability.
- Removed the blanket public `Cache-Control` on all APIs. Authenticated/admin/auth/ask/predict routes
  are `private, no-store`; public read routes opt in to 60s s-maxage explicitly.
- Rate limits on predict/share-card; ingestion refuses private hosts/SSRF targets and the cron route
  no longer accepts a caller-supplied URL.
- `postinstall: prisma generate`, seed refuses production unless explicitly overridden.
- CI now runs lint, verify, fixture ingestion, ask eval, backtest, build, `migrate deploy`, seed, and
  Playwright against a production build.
- Added OG image, predictor/explore metadata, and `docs/DEPLOY-CHECKLIST.md`.

## Final verification

- `pnpm verify`: 63 tests + 4 selfcheck suites, green.
- `pnpm e2e`: 4/4 against a production build with a seeded PostgreSQL.
- `pnpm lint`: 0 errors, 0 warnings.
- `pnpm build`: green, including the new admin, ask, leads, feedback, share-card, counsellor,
  programmatic-college, sitemap, and robots routes.
- `pnpm ingest --dry-run`: 100 parsed / 95 matched.
- `pnpm backtest`: green; proxy report committed.
- `pnpm eval:ask`: targets met; reports committed.
