# CampusScope decisions

## Track A completion

- The MVP intentionally focuses on four evaluated workflows: discovery, college detail, comparison, and predictor. Authentication and saved colleges are out of scope for this iteration.
- The connected Neon/Postgres database remains the production source of truth through Prisma. Preview/demo fallback data is isolated in `lib/demo-data.ts` and is explicitly marked with `source: 'preview-demo'` in API responses.
- The predictor is deliberately directional and explainable. It exposes assumptions and uses a score band rather than presenting an admissions guarantee.
- The UI direction is editorial admissions research: restrained blue/teal tokens, clear hierarchy, practical microcopy, responsive controls, and visible empty/error/loading states.

## Continuation checklist

1. Verify the Neon schema is available in the target deployment and run the existing Prisma seed workflow against it.
2. Replace or expand the small preview dataset with the authoritative college catalog and update the data provenance copy.
3. Add automated route tests for query validation, compare limits, missing IDs, and predictor boundaries.
4. Add a real predictor model only with a documented dataset and validation methodology; keep the current heuristic as the transparent fallback.
5. Add production security headers and monitoring once the deployment domain and API origins are known.

- Prisma is the ORM because it is mandatory in the TRD; Neon remains the PostgreSQL runtime via `DATABASE_URL`.

## Admissions intelligence expansion (2026-08-22)

- New models: `CapRoundTrend` (round-over-round closing cutoffs incl. spot), `SeatMatrix` (quota split per branch), `CampusInsight` (moderated senior notes, read-only — no public write path), `AdmissionDeadline` (global timeline, homepage banner).
- `College` gained `cautionDeposit`, `eligibleScholarships`, `topRecruiters`, `studentFacultyRatio`, `nirfRank`, `autonomous`. Existing `fees`/`hostelFees` double as tuition/hostel fees rather than duplicating columns.
- Predictor logic (classify ±2.0 band, latest-round dedupe, score) lives in `lib/predict-core.ts`, covered by `pnpm check`. DB failures now return 503 instead of faking an empty result.
- ROI = avg package ÷ (4-yr tuition + hostel); shown as a badge on cards, profiles, and compare.
- Google Places photo URLs are proxied through `/api/google-places/photo` so the API key stays server-side. Travel estimates use Google Distance Matrix via `/api/distance` (`GOOGLE_MAPS_API_KEY`).
- PDF export uses the browser print pipeline with print-scoped CSS (`[data-print-root]`); CSV export builds a Blob client-side. No PDF/CSV dependency was added.
- Option form default ordering sorts by closing cutoff descending because CAP allots the highest preference a candidate clears.
- `.env` had been committed historically; it is now untracked and ignored. Keys must be rotated.

## Candidate portal & counselling expansion (2026-08-22)

- Auth: Auth.js (NextAuth v5, `next-auth@beta`) with JWT sessions + Prisma adapter. Google provider activates only when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` exist; the UI hides sign-in and everything else works unauthenticated. Email magic links need SMTP — deferred.
- New models: `SavedCollege` (target branch/category/priority/status per user, unique per user+college), `ApplicationTracker`, `PeerConnectRequest` (moderated request flow with query templates — no realtime chat until a transport exists), `SpotRoundNotice` (vacancy feed; seeded sample notices).
- `/simulator` reuses the pure `lib/simulator.ts` (order-inversion warnings, duplicate detection, probable-allotment walk) on both client and server; covered by `pnpm check`. Drag-and-drop uses framer-motion's `Reorder` (the one explicitly requested animation dependency).
- Simulator cutoffs come from `CapRoundTrend` spot/round-3 closing percentiles for the chosen exam+category.
- Campus map tab embeds keyless Google Maps iframe; landmark probes reuse the Places text-search helper with caching.
- Document readiness checklist is a static policy snapshot in `app/documents/page.tsx` persisted to localStorage per device — move to DB when admin management is needed.

## Probability engine, scholarships matrix & telemetry (2026-08-22)

- `/api/predict/probability` uses a one-parameter logistic on `CapRoundTrend` closing cutoffs (k=1.2 percentile points); OTH-university quota subtracts 3 effective percentile points. Round chances are enforced monotonic non-decreasing. Pure logic in `lib/probability.ts`, covered by `pnpm check`.
- Scholarship waivers now live on `College` (`ebc/tfws/scSt/minorityConcessionPct`) — this retires the hardcoded EBC/TFWS constants flagged in the earlier FinancialCard ponytail note. Eligibility gating (income brackets, category) is shared math in `lib/scholarships.ts`; only the single best waiver applies (no stacking).
- Spot-round tracking: `SpotApplication` (unique per user+notice) with Applying/Submitted/Attended/Allotted flow via `/api/user/spot-applications`.
- Telemetry: one generic `AnalyticsEvent` table + fire-and-forget writes (`lib/telemetry.ts`); branch searches logged from listings, simulator loads, and coarse docs-readiness percentages from the checklist client. No PII. Admin view at `/admin/analytics` gated by `ADMIN_EMAILS` env CSV — no roles table until needed; charts are CSS bars (no chart library).
- Reticle runtime verification is not available in this environment; equivalent verification is executed manually each round: `tsc --noEmit`, `pnpm check` selfchecks, production build, and live-server smoke tests of every touched route.

## Cron sync, notifications, mentors & forum (2026-08-22)

- `/api/cron/sync-cutoffs` gates on `Authorization: Bearer $CRON_SECRET` (standard bearer-token convention) — 403 on any mismatch. The pipeline is a simulated upstream (ponytail-noted): round-robin college batches, per-row drift updates on `CapRoundTrend`, mirrored decrements on `Cutoff`, one open `SpotRoundNotice` per college. No long transactions → no locks; run status lands in `AnalyticsEvent`.
- `Notification` model with nullable `dedupeKey` unique per user — cron emits cutoff/spot alerts once per day per college; deadline reminders (≤24h out) are synthesized at read time instead of needing another cron.
- Bell drawer polls every 60s while signed in — "live enough" at zero infra cost (SSE/websockets deliberately deferred).
- Mentoring: mentors publish 15-min slots; booking claims the slot via a conditional `updateMany` (status Open→Booked), which is atomic — concurrent candidates cannot double-book; failed booking creation compensates back to Open. Verified-senior badge = author hosts slots at that college (reuses real data rather than a self-reported flag).
- Forum votes use one polymorphic-ish `ForumVote` table (nullable post/comment side) with a toggle transaction; comment voting is schema-ready but not surfaced in UI yet.
- Prisma uses a `globalThis` singleton in `lib/prisma.ts` to prevent hot-reload connection exhaustion.
- College listing defaults to 12 results per page and caps client-controlled page size at 50.
- Compare selection uses React Context only; the compare URL is the source of truth for refreshable/shared comparison pages.
- Seed data intentionally includes varied Indian locations, fees, ratings, and sparse related records so filters and empty states are exercised.
- API errors use `{ error, details? }` with 400 validation, 404 missing resources, and 500 unexpected errors.
