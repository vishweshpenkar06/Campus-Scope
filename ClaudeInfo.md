# ClaudeInfo.md — CampusScope Codebase Analysis

> Complete analysis of the CampusScope project. Regenerated 2026-08-22 after the admissions-intelligence expansion, candidate portal, counselling suite, and production hardening rounds. Supersedes all earlier versions. Decision history lives in `DECISIONS.md`; deployment steps in `README.md`.

---

## 1. Project Overview

**CampusScope** is an end-to-end engineering-admissions companion for Indian colleges (MHT-CET / JEE Main focus). It spans discovery → prediction → simulation → option-form export → document readiness → spot-round tracking → senior mentoring → community Q&A.

- **Package**: `campusscope` v0.1.0 (private)
- **Framework**: Next.js 16 App Router (Turbopack dev), React 19, TypeScript 5.7 strict-safe
- **Data**: Prisma 6 over PostgreSQL (Neon) via `DATABASE_URL`
- **Auth**: Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter`, Google provider (env-gated), JWT sessions
- **Styling**: Tailwind CSS 4 + editorial design system (Newsreader display / DM Sans body, paper tones, ink-navy primary)

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.0 (App Router), React 19 |
| Language | TypeScript 5.7.3 |
| ORM / DB | Prisma 6.19 · PostgreSQL/Neon |
| Auth | next-auth@5 beta, @auth/prisma-adapter, JWT strategy |
| Validation | Zod on every input-bearing route |
| Styling | Tailwind 4, tw-animate-css, CVA; framer-motion (Reorder) in `/simulator` only |
| Charts | CSS bars only (no chart library) |
| External APIs | Google Places (New) Text Search + Photo Media, Google Distance Matrix |
| Analytics | none (self-hostable; event sink in-app) |

## 3. Directory Structure

```
app/
├── admin/analytics/page.tsx        # Admin telemetry dashboard (RSC, ADMIN_EMAILS gate)
├── api/                            # 26 route handlers — see §7
├── college/[id]/page.tsx+loading   # College profile shell (client detail component)
├── compare/page.tsx                # Comparison matrix (?ids=1,2,3)
├── documents/page.tsx              # Document readiness calculator
├── error.tsx / global-error.tsx / not-found.tsx
├── explore/page.tsx · option-form/page.tsx · predictor/page.tsx
├── shortlist/page.tsx · simulator/page.tsx · spot-rounds/page.tsx
├── layout.tsx · globals.css · page.tsx (home: banner + onboarding + explorer + predictor)
components/                        # 26 components — see §8
lib/
├── auth.ts            # NextAuth config (Google-only provider list, JWT, session.id callback)
├── cron-sync.ts       # Simulated cutoff/vacancy ingestion pipeline
├── demo-data.ts       # 3-college fallback dataset (source: 'preview-demo')
├── format.ts          # INR/package/rating/ROI formatters, parseFacilities/parseList
├── google-places.ts   # Places text search + photo proxy URLs + landmark probes (cached)
├── predict-core.ts    # classify ±2.0 bands, latest-round dedupe, computeScore
├── probability.ts     # logistic round-chances engine (k=1.2, OTH penalty −3)
├── prisma.ts          # globalThis singleton client
├── rate-limit.ts      # in-memory fixed-window limiter + clientIp
├── scholarships.ts    # scheme matrix + income gating + best-net-tuition math
├── simulator.ts       # order warnings, duplicate detection, allotment walk
├── telemetry.ts       # fire-and-forget AnalyticsEvent logger
├── types.ts           # shared domain types
├── utils.ts · validation.ts (Zod schemas + errorResponse helpers)
prisma/
├── schema.prisma      # 25 models (~343 lines)
└── seed.ts            # 34 colleges, 2700 cutoffs, 1010 trends, seat matrices, insights,
                       # deadlines, spot notices, mentors+slots, forum posts
scripts/selfcheck.ts  # assert-based suites run via `pnpm check`
```

## 4. Database Schema (25 models)

### Catalog & admissions data
- **College** — identity + fees/rating/overview; extended fields: websiteUrl, admissionUrl, establishedYear, campusSize, accreditation, hostelFees/Available, facilities (JSON str), cautionDeposit, eligibleScholarships (JSON str), topRecruiters (JSON str), studentFacultyRatio, nirfRank, autonomous, and concession percentages `ebc/tfws/scSt/minorityConcessionPct`. Indexes: name, location, [location,fees], rating.
- **Course** · **Placement** (per year avg/highest/rate) · **Review** — cascaded children.
- **Cutoff** — per exam/capRound/category/branch/year percentile. Indexes: [collegeId,exam,year], [exam,category,branch], percentile.
- **CapRoundTrend** — round1/2/3 + spot closing percentiles per college/year/exam/category/branch; unique on that tuple; drives simulator + probability engine.
- **SeatMatrix** — quota split (open/obc/sc/st/tfws/allIndia) per branch; unique [collegeId,branch].
- **CampusInsight** — moderated "Senior Talk" notes (attendanceStrictness, canteenRating, placementSupport).
- **AdmissionDeadline** — global DTE/CAP timeline (title, eventDate, category, officialLink).
- **SpotRoundNotice** — institute-level vacancies (vacancyCount, deadline, noticePdfUrl); indexes eventDate + collegeId.

### Identity & portal
- **User** (+ Auth.js **Account**, **Session**, **VerificationToken**) — email/name/image plus exam/percentile/category profile fields.
- **SavedCollege** — targetBranch, category, priority, status (Researching→Allotted); unique [userId,collegeId].
- **ApplicationTracker** — freeform application rows.
- **PeerConnectRequest** — moderated question requests to seniors.
- **SpotApplication** — per-user tracker on a notice (Applying/Submitted/Attended/Allotted); unique [userId,noticeId].
- **Notification** — userId, title/message/type/read + nullable dedupeKey (unique [userId,dedupeKey]) powering idempotent reminders.

### Community & mentoring
- **MentorSlot** — mentorId/collegeId/startTime/durationMin(15)/status Open|Booked; booking claims via conditional update.
- **Booking** — one per slot (unique slotId), candidateId, status.
- **ForumPost / ForumComment** — per-college Q&A with upvotes and isSeniorAnswer flag (display badge is computed live from MentorSlot ownership instead).
- **ForumVote** — single vote table, nullable postId/commentId side, unique per user per target.

### Ops
- **AnalyticsEvent** — generic telemetry row (type search|simulator|docs|cron, label, value).

## 5. Auth Architecture

- Provider list is built conditionally: Google only when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` exist (`authConfigured` export). No providers ⇒ sign-in button hidden app-wide; every feature stays usable unauthenticated except guarded writes.
- JWT sessions (`strategy: 'jwt'`); adapter persists User/Account rows at OAuth time; `session` callback copies `token.sub` → `session.user.id` (type-augmented in `types/next-auth.d.ts`).
- Client side uses `SessionProvider` in `AppShell`; `useSession` gates bell/auth-button UIs.

## 6. Prediction, Simulation & Probability Logic

- **predict-core.ts** — `classify(pct, cutoff)` Safe ≥ c+2 / Target ±2 / Reach below; `dedupeLatestRound` keeps each college+branch's highest-round lowest-cutoff row; `computeScore` returns 0 when no matches (no misleading bonuses), caps at 95.
- **simulator.ts** — order-inversion warning (a later choice harder than the easiest one above it will never be reached under first-clear-wins allotment), duplicate detection, `simulateAllotment` walk.
- **probability.ts** — logistic P = σ((percentile−cutoff)/1.2) per round using CapRoundTrend cutoffs; OTH-university subtracts 3 effective points; chances forced monotonic non-decreasing across rounds; best regular round surfaced ("88% Allotment Chance in CAP Round 3").

## 7. API Routes (26 handlers)

Public reads: `colleges`(+detail), `compare`, `locations`, `predict`, `predict/probability`, `deadlines`, `spot-notices`, `simulator` (choice pool), `google-places`(+photo proxy), `places/nearby`, `distance`, `forum` GET, `mentors/slots` GET, `analytics/event` POST (rate-limited 30/min/IP).

Auth-guarded (401 without session):
| Route | Methods | Notes |
|---|---|---|
| `/api/user/shortlist` (+`[id]`) | GET POST PATCH DELETE | ownership checked before update/delete |
| `/api/user/spot-applications` | GET POST | status workflow, submittedAt set automatically |
| `/api/user/notifications` | GET PATCH | synthesizes ≤24h deadline reminders (dedupeKey-idempotent); `{ids}` or `{all}` mark-read |
| `/api/forum` POST · `[postId]` POST · `vote` POST | create/comment/upvote-toggle (transactional) |
| `/api/peer-connect` | GET POST | moderated request flow |
| `/api/mentors/slots` POST · `book` POST | slot creation; atomic Open→Booked claim (409 on loss) with compensating rollback |

Secret-gated: `/api/cron/sync-cutoffs` GET — requires `Authorization: Bearer $CRON_SECRET`, else **403**; drift-updates CapRoundTrend batches, mirrors to Cutoff, keeps one open SpotRoundNotice per college, notifies SavedCollege watchers once/day, logs to AnalyticsEvent.

Admin: `/admin/analytics` page (not API) — server component gated by `ADMIN_EMAILS` CSV vs session email.

## 8. Pages & Components

| Page | Contents |
|---|---|
| `/` | DeadlineBanner → OnboardingModal (localStorage) → FilterBanner → AutoAllotment tiers → CollegeExplorer → Predictor |
| `/college/[id]` | Tabs: Overview (+FinancialCard w/ ScholarshipCalculator modal, CommuteChecker, AskSenior, MentorSlots), Courses, Placements (ROI col), Cutoffs, CAP Trends, Seat Matrix, Reviews, Senior Talk, Q&A Forum, Campus & Travel (map embed + landmarks), Google reviews; header: RoiBadge, ShareActions (WhatsApp + print-PDF via `[data-print-root]` CSS), SaveCollegeButton |
| `/compare` | 15-row matrix incl. ROI, NIRF, autonomous, ratio, recruiters, hostel |
| `/option-form` | preference builder → CSV Blob + window.print() PDF |
| `/simulator` | framer-motion Reorder list (≤100), live rule warnings, probable-allotment highlight |
| `/documents` | category-driven scrutiny checklist, readiness meter, localStorage + coarse telemetry |
| `/shortlist` | saved-college CRUD dashboard |
| `/spot-rounds` | vacancy feed + per-user application tracking |
| `/admin/analytics` | four CSS-bar sections: top branches, shortlist leaders, percentile histogram, docs-readiness averages |

Header (`AppShell`): nav (Explore/Predictor/Simulator/Documents/Spot Rounds/My Shortlist/Compare) + NotificationBell (60s poll) + AuthButton.

## 9. Security Model

- Secrets strictly server-side; photos proxied through `/api/google-places/photo` (regex-validated media names) so no key reaches browsers.
- Rate limiting: analytics sink 30/min/IP; probability engine 30/min/IP (in-memory, ponytail-noted for Redis upgrade).
- Zod validation on every input-bearing handler; Prisma parameterization prevents injection; ownership checks precede writes on shortlist entries.
- `.env` untracked + gitignored (was committed historically — **keys still need rotation**).
- Error surfaces: `error.tsx`/`global-error.tsx` boundaries with digest reference; every page has loading skeleton + empty/error states; APIs degrade gracefully (deadlines/spot feeds return empty arrays rather than failing pages).

## 10. Environment Variables

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres |
| `AUTH_SECRET` | yes (prod) | Auth.js signing |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | enables Google sign-in |
| `GOOGLE_PLACES_API_KEY` | optional | photos/ratings/landmarks |
| `GOOGLE_MAPS_API_KEY` | optional | Distance Matrix commute estimates |
| `CRON_SECRET` | for cron | bearer gate on sync endpoint |
| `ADMIN_EMAILS` | optional | CSV allow-list for `/admin/analytics` |

## 11. Verification & Ops

- `pnpm check` → `scripts/selfcheck.ts`: four assert suites covering predictor classification/dedupe/scoring, simulator ordering/allotment, probability monotonicity + OTH penalty + best-round selection, scholarship income gating + no-stacking net tuition.
- `tsc --noEmit` clean; `next build` generates 33 routes.
- Cron: point any external scheduler at `/api/cron/sync-cutoffs` with the bearer token (e.g. `"0 */6 * * *"`).
- Seed (`pnpm db:seed`) wipes and rebuilds catalog + derived data; mentor/demo users persist across reseeds.

## 12. Known Limitations & Ponytail Trade-offs

1. Leaked credentials in git history require rotation before real traffic.
2. In-memory rate limiting/caches are per-instance (single-region assumption).
3. Cron ingestion simulates upstream drift; swap in DTE/JoSAA feed parsing behind `runCutoffSync`.
4. Email magic-link login deferred (needs SMTP); WhatsApp share uses wa.me deep link.
5. Comment voting schema exists but isn't surfaced in UI yet.
6. Document checklist is a static policy snapshot stored per-device; telemetry receives only category + % complete.
7. Demo fallback dataset ignores some filters' full fidelity (branch filter supported; source-tagged `preview-demo`).

*End of analysis.*
