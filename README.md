<div align="center">

# CampusScope

### Make a Better College Shortlist

<br>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-v10-f9a825?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvishweshpenkar06%2FCampus-Scope)

<br>

**Search colleges. Read the real cutoffs. Simulate your CAP rounds.**
**Get percentile-matched recommendations, seat matrices, financial breakdowns, and senior insights — all from one database-backed catalog.**

<br>

**[Get Started](#-getting-started)** · **[Architecture](#-architecture)** · **[Features](#-features)** · **[API](#-api-endpoints)** · **[Deploy](#-deploy)** · **[Contributing](docs/CONTRIBUTING.md)** · **[Security](docs/SECURITY.md)** · **[Issues](https://github.com/vishweshpenkar06/Campus-Scope/issues)**

</div>

---

<br>

## Table of Contents

- [Problem](#problem)
- [Architecture](#architecture)
- [Features](#features)
- [Performance](#performance)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database](#database)
- [Testing](#testing)
- [FAQ](#faq)
- [API Endpoints](#api-endpoints)
- [Deploy](#deploy)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

<br>

## Problem

Every engineering admission season, lakhs of students make a life-shaping decision with almost no structured information.

- **Cutoffs are opaque** — round-wise closing percentiles exist, but nobody presents them as trends you can act on
- **Fees are misleading** — tuition is quoted, hostel, deposits, and scholarship waivers are buried in brochures
- **Comparison is manual** — five open tabs, one spreadsheet, and still no apples-to-apples view
- **Predictors are guesswork** — most tools output vague tiers with no explanation of how the number was computed
- **Late-round opportunities are missed** — spot rounds close in days, and vacancy notices surface after deadlines die
- **Advice is anecdotal** — seniors know the truth about attendance and placements, but there's no way to reach them

**CampusScope** solves this by turning raw admission data — cutoffs, seat matrices, fees, deadlines — into structured, explainable, decision-ready intelligence for candidates and parents.

---

## Architecture

```
Candidate Input (Exam · Percentile · Category · Branch)
      │
      ▼
┌──────────────────────────────────────────────────────┐
│  Step 1: Onboarding & Personalization                 │
│  JEE/CET choice persisted locally; drives             │
│  recommendation tiers, filters, and defaults          │
├──────────────────────────────────────────────────────┤
│  Step 2: Discovery Engine (Prisma → PostgreSQL)       │
│  Server-side contains-search across name/location,    │
│  fee-range/rating/branch filters, pagination          │
├──────────────────────────────────────────────────────┤
│  Step 3: Prediction Core (lib/predict-core.ts)        │
│  Matches percentiles against 2,700+ real Cutoff rows  │
│  Safe ≥ cutoff+2.0 · Target ±2.0 · Reach below        │
│  Latest-round dedupe → one honest row per college     │
├──────────────────────────────────────────────────────┤
│  Step 4: Probability Engine (lib/probability.ts)      │
│  Logistic model over round-wise closing cutoffs       │
│  "% Allotment Chance in CAP Round N", home-vs-OTH     │
│  quota penalty, monotonic-across-rounds guarantee     │
├──────────────────────────────────────────────────────┤
│  Step 5: Counselling Tooling                          │
│  Mock option-form simulator with rule validation +    │
│  drag-drop reorder (≤100 choices) · CSV/print-PDF     │
│  exports · document readiness calculator              │
├──────────────────────────────────────────────────────┤
│  Step 6: Portal, Community & Ops                      │
│  Auth.js Google OAuth · saved shortlists · spot-round │
│  tracker · atomic mentor booking · Q&A forum ·        │
│  idempotent notifications · cron data pipeline        │
├──────────────────────────────────────────────────────┤
│  Storage & Presentation                               │
│  PostgreSQL (Neon) via Prisma · 33 Next.js routes ·   │
│  error boundaries + skeleton/empty states everywhere  │
└──────────────────────────────────────────────────────┘
      │
      ▼
Structured Admissions Intelligence
```

Every logic layer (`predict-core`, `probability`, `simulator`, `scholarships`) is a pure TypeScript module with its own assert-based self-check suite. If the database is unreachable, read surfaces degrade to a tagged demo dataset instead of dying; write surfaces fail loudly with typed errors rather than faking success.

---

## Features

### Discovery That Behaves Like a Product

- **Server-side search** — name and location matching through indexed Prisma queries; nothing hardcoded client-side
- **Filters that persist** — location, branch, fee range, rating sync into the URL, so every filtered view is shareable and survives refresh
- **Pagination** — 12 per page, server-capped at 50; page state lives in the URL too
- **ROI Index** — average package ÷ 4-year total cost (tuition + hostel), surfaced on cards, profiles, and the comparison matrix

### College Profiles With Depth Most Listings Skip

Ten tabs on every profile:

| Tab | What You Get |
|------|-------------|
| **Overview** | Overview text + financial breakdown card with per-category totals |
| **Courses** | Duration + course-level fees |
| **Placements** | Year-wise avg/highest package, placement rate, per-row ROI |
| **Cutoffs** | Raw exam/category/round-filtered percentile tables |
| **CAP Trends** | Round-over-round closing-cutoff bars; green highlight where spot rounds drop ≥1.5 points |
| **Seat Matrix** | OPEN/OBC/SC/ST/TFWS/All-India quota bars per branch |
| **Reviews** | Student reviews with ratings |
| **Senior Talk** | Moderated alumni notes — attendance strictness, canteen rating, placement support |
| **Q&A Forum** | Ask, answer, upvote; sort by newest/most-upvoted; verified-senior badges |
| **Campus & Travel** | Embedded map, nearest station/PG/mess landmarks, commute time estimator |

Plus: **Scholarship Calculator** (toggle family income brackets → live 4-year totals), **WhatsApp share**, **print-to-PDF summary**, and **save to shortlist**.

### A Predictor You Can Audit

Most predictors are black boxes. This one ships its math.

- Matches your percentile against **real closing cutoffs** per exam/category/branch
- Bands are explicit: Safe = cutoff + 2.0, Target = within ±2.0, Reach = below
- Each response includes an **assumptions array** explaining exactly how the number was produced
- `/api/predict/probability` goes further — a logistic model outputs **"% Allotment Chance in CAP Round 2"** style percentages per round, with a home-university vs other-than-home quota adjustment


### Trusted Data, Not Just More Rows

Every published cutoff, trend, seat-matrix, and placement row carries its own provenance:
`sourceUrl`, `sourceName`, `sourceDate`, `verifiedAt`, `verifiedBy`, and `confidence`.

- **Staging pipeline** — `pnpm ingest --source <id>` fetches an official source, normalizes
  college/branch/category/round values, fuzzy-matches colleges, and writes `StagingRecord` rows.
- **Human review** — `/admin/ingest` shows the incoming value next to the existing row. Nothing is
  published until an admin approves it; rejection leaves the published table untouched.
- **Visible trust** — profile cutoff tables and predictor results carry a Verified/Unverified badge
  and a staleness warning after 180 days.
- **No simulated drift** — the cron sync stages real source rows and returns `staged: 0` when no
  source is configured. There is no `Math.random()` in any production data path.
- **Backtested probability** — `pnpm backtest` emits Brier score, log loss, and a calibration table
  to `docs/BACKTEST.md`; `PROBABILITY_MODEL_VERSION` travels with every probability response.

The committed ingestion fixture is synthetic and labelled `fixture` — it tests the parser and
95% match rate, and must never be published. Real ingestion requires the current official URL.

### Ask in Your Own Words

`/api/ask` accepts natural language, extracts slots (provider chain: CampusLM → Gemini → deterministic
rules), and runs the existing deterministic engines. Results carry citations; the LLM never computes a
cutoff or a probability. The UI makes the extracted slots editable and re-runs the same deterministic
path. A 100-query eval is committed at `eval/ask/queries.jsonl` with results in `docs/ASK_EVAL.md`.

### Counsellors, Leads, and Share Cards

`/counsellors` lists independent counsellors; the profile form creates a `Lead` and emails it through
Resend (console fallback without a key). `/admin/leads` is the pipeline. The chance-card endpoint
renders a PNG with the college, cutoff, user percentile, and source state.

### Option Form Simulator

Drag up to 100 preferences (Framer Motion `Reorder`). Live validation flags CET Cell rule violations — e.g. *"Preference #3 closes at 90.10 above this — you would likely be allotted there first and never reach this college."* One click runs a **probable seat allotment**: the first preference your percentile clears, walked against historical closing cutoffs.

### Export Pipeline

CSV builds via Blob download with proper escaping; PDF rides the browser print pipeline with print-scoped CSS. Zero PDF/chart dependencies shipped for either.

### Spot Rounds & Vacancy Feed

Institute-level vacancies published after regular rounds close — filterable by branch, countdown urgency on deadlines, and per-user application tracking (`Applying → Submitted → Attended → Allotted`).

### Mentoring With Race-Safe Booking

Verified seniors publish 15-minute slots. Booking claims the slot via a conditional database update — two candidates clicking simultaneously produce exactly one winner and one clean 409.

### Candidate Portal

Google sign-in via Auth.js v5 (JWT sessions + Prisma adapter). Saved shortlists carry target branch, category, priority, and application status. A bell drawer polls for new alerts: cutoff changes on saved colleges, fresh spot notices, deadline reminders within 24 hours — all idempotent via dedupe keys.

### Admin Analytics

`ADMIN_EMAILS`-gated dashboard: top searched branches, most-shortlisted colleges, candidate percentile distribution histogram, document-readiness averages. CSS-bar visualizations — zero chart libraries. Telemetry writes are fire-and-forget and can never break the request they ride on.

---

## Logic Engines (Pure, Tested, Explainable)

| Module | Responsibility | Guarantees |
|--------|---------------|------------|
| `lib/predict-core.ts` | Band classification, latest-round dedupe, score computation | Score returns 0 (not fake bonuses) with zero matches; caps at 95 |
| `lib/probability.ts` | Logistic round chances | Monotonic non-decreasing across rounds; OTH quota −3 effective points; boundary = exactly 50% |
| `lib/simulator.ts` | Order validation + allotment walk | Detects unreachable higher-preference picks and duplicates |
| `lib/scholarships.ts` | Scheme eligibility + net tuition | Income/category gating; only the single best waiver applies — never stacked |

All four are covered by `pnpm check` — assert-based suites, no test framework bloat.

---

## Features Checklist

✅ Server-Side Search with Indexed Prisma Queries
✅ URL-Synced Filters + Pagination (server-capped pageSize)
✅ Onboarding Flow Driving Personalized Recommendations
✅ College Profiles — 10 Tabs Including Trends & Seat Matrix
✅ CAP Round Trend Visualization (Round 1 → Spot)
✅ Seat Matrix Quota Bars Per Branch
✅ Financial Breakdown + Interactive Scholarship Calculator
✅ ROI Index Across Cards, Profiles, Comparison
✅ Safe/Target/Reach Predictor Against Real Cutoff Records
✅ Logistic Probability Engine With Per-Round Percentages
✅ Home vs Other-than-Home University Quota Handling
✅ Drag-and-Drop Option Form Simulator (≤100 Choices)
✅ CAP Rule Validation Warnings + Probable Allotment
✅ CSV + Print-Pipeline PDF Exports (Zero Extra Dependencies)
✅ Document Readiness Calculator (OPEN → J&K Migrant)
✅ Spot Round Feed + Application Status Tracker
✅ Atomic Mentor Slot Booking (Race-Safe)
✅ Per-College Q&A Forum With Upvotes + Verified Badges
✅ Google OAuth via Auth.js v5 + Saved Shortlist Portal
✅ Notification Bell With Idempotent Alert Generation
✅ Bearer-Gated Cron Pipeline Logging Run Telemetry
✅ IP Rate Limiting on Public Write/Heavy Endpoints
✅ API Key Proxying — Photos Never Expose Keys
✅ Ownership Checks Before Every User-Data Mutation
✅ Admin Analytics Dashboard (CSS Bars, No Chart Lib)
✅ Demo-Dataset Fallback Tagged `preview-demo`
✅ Global + Route Error Boundaries With Digests
✅ 4 Self-Check Suites Via `pnpm check` + 45 Vitest assertions
✅ Provenance Fields + Verified/Unverified Badges + Freshness Warnings
✅ Staging Ingestion Pipeline With Admin Approve/Reject
✅ Deterministic Cron Sync (No Random Drift)
✅ Versioned Probability Model + Brier/Calibration Backtest
✅ Natural-Language Ask Endpoint With Citations + Rules Fallback
✅ Counsellor Directory + Lead Pipeline + Chance-Card PNG
✅ Sitemap, Robots, Programmatic College Pages, JSON-LD
✅ CI Workflow + Playwright Smoke Specs
✅ Feedback Capture For The Pilot

---

## Performance

- **Framework**: Next.js 16 with Turbopack for fast dev builds.
- **Rendering**: Static shell with dynamic data fetching, aggressively cached via Prisma.
- **Styling**: Pure CSS (`oklch` tokens), zero runtime JS for styling. CSS bars instead of chart libraries.
- **Assets**: Minimized iconography via `lucide-react`.
- **Telemetry**: Lightweight event tracking via `AnalyticsEvent` table. No PII is collected.

...

## FAQ

**Q: Can I use this for other exams?**
A: Currently tuned for Indian engineering admissions (JEE/CET).

**Q: How do I update cutoffs?**
A: Configure `CRON_SECRET` and trigger `/api/cron/sync-cutoffs`.

## License

Distributed under the MIT License.

## Acknowledgements

- Built with [Next.js](https://nextjs.org/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Database by [Neon](https://neon.tech/)
- ORM by [Prisma](https://prisma.io/)

## Contributors

- [Vishwesh Penkar](https://github.com/vishweshpenkar06)

---

### How to verify

Run the following command to ensure the project is stable:

```bash
pnpm verify
```

### Security

Please report security issues directly to the maintainer. See [SECURITY.md](docs/SECURITY.md) for details.

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 + Tailwind CSS v4 |
| **Language** | TypeScript (strict) |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma 6 — 25 models |
| **Auth** | Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter`, JWT sessions |
| **Validation** | Zod on every input-bearing route |
| **External APIs** | Google Places (New), Google Distance Matrix |
| **Animation** | Framer Motion `Reorder` (simulator only) |
| **Charts** | Pure CSS bars — no chart library |
| **Icons** | Lucide React |
| **Fonts** | Newsreader (display) · DM Sans (body) |

---

## Design System

An **editorial research-desk direction**, built on CSS custom properties:

- **Color Tokens** — paper-toned `oklch()` background, ink-navy foreground/primary, 15+ semantic tokens, dark-mode variants
- **Typography** — Newsreader serif display with tight tracking, DM Sans body, uppercase `.eyebrow` labels
- **Components** — restrained `border-foreground/10` borders, flat cards, no decorative gradients
- **States** — every async surface has skeleton, error-with-retry, and empty states; sparse seed data makes them real, not theoretical

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm
- A PostgreSQL database (Neon free tier works)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/vishweshpenkar06/Campus-Scope.git
   cd Campus-Scope
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   Create `.env` (see [Environment Variables](#environment-variables)). Minimum viable config is just `DATABASE_URL`.

4. **Set Up Database**
   ```bash
   pnpm exec prisma migrate deploy   # fresh DB (or: pnpm db:push)
   # existing DB created with db push:
   #   pnpm db:push && pnpm backfill:provenance
   pnpm run db:seed                  # 34 colleges, demo cutoffs/trends/seats, forum, mentors, counsellors
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Access the Application**
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |

### Optional

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Auth.js signing key (required in production) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Enable Google sign-in — everything works without them |
| `GOOGLE_PLACES_API_KEY` | Campus photos, ratings, nearby landmarks |
| `GOOGLE_MAPS_API_KEY` | Commute time estimates (Distance Matrix) |
| `CRON_SECRET` | Bearer gate for `/api/cron/sync-cutoffs` |
| `ADMIN_EMAILS` | Comma-separated allow-list for `/admin/*` |
| `CAMPUSLM_URL` | Self-hosted CampusLM chat-completions base (first in the ask chain) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini free-tier slot extraction (second in the chain) |
| `RESEND_API_KEY` / `RESEND_FROM` | Lead email delivery (console fallback without it) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for sitemap/robots/share cards |
| `DTE_CUTOFF_URL` / `INGEST_SOURCE` | Official source URL and source id for ingestion |
| `CAMPUSLM_MODEL` / `CAMPUSLM_API_KEY` | Optional CampusLM model/auth |
| `SENTRY_DSN` | Optional Sentry error/performance capture (package installed) |

Graceful degradation is built in: no Places key hides photos/landmarks; no Maps key hides commute times; no Google OAuth hides the sign-in button while keeping every other feature usable.

---

## Project Structure

```text
campus-scope/
├── app/
│   ├── api/
│   │   ├── colleges/               Listing (+filters, telemetry) · [id] detail
│   │   ├── predict/                Safe/Target/Reach · probability/ (% engine)
│   │   ├── simulator/              Choice pool for the mock option form
│   │   ├── user/
│   │   │   ├── shortlist/[id]/     Saved-college CRUD (ownership-checked)
│   │   │   ├── spot-applications/  Spot round status tracking
│   │   │   └── notifications/      GET feed · PATCH mark-as-read
│   │   ├── mentors/                slots/ (publish) · book/ (atomic claim)
│   │   ├── forum/                  Posts, replies, vote toggle
│   │   ├── cron/sync-cutoffs/      Bearer-gated ingestion pipeline
│   │   ├── analytics/event/        Public telemetry sink (rate-limited)
│   │   ├── compare/ locations/ deadlines/ distance/
│   │   ├── google-places/ (+photo proxy) places/nearby/
│   │   └── auth/[...nextauth]/     Auth.js handlers
│   ├── admin/analytics/            Gated dashboard (server component)
│   ├── college/[id]/               Profile shell → 10-tab detail
│   ├── simulator/ option-form/ documents/
│   ├── shortlist/ spot-rounds/ explore/ predictor/ compare/
│   └── error.tsx global-error.tsx not-found.tsx
├── components/                     26 components (explorer, trends, seat matrix,
│                                   financial card, simulator, forum tab, bell…)
├── lib/
│   ├── predict-core.ts             Classification · dedupe · scoring
│   ├── probability.ts              Logistic round-chance engine
│   ├── simulator.ts                Rule validation + allotment walk
│   ├── scholarships.ts             Eligibility matrix + net-tuition math
│   ├── cron-sync.ts                Simulated upstream ingestion
│   ├── rate-limit.ts               Fixed-window limiter + client IP
│   ├── google-places.ts            Text search + photo proxy + landmarks
│   ├── auth.ts prisma.ts validation.ts format.ts types.ts telemetry.ts
├── prisma/
│   ├── schema.prisma               25 models
│   └── seed.ts                     Full catalog + derived datasets
└── scripts/selfcheck.ts            4 assert-based suites (`pnpm check`)
```

---

## Database

PostgreSQL on Neon through Prisma. `prisma db push && pnpm run db:seed` sets up everything.

### Schema Overview

The schema is divided into seven functional groups:
- **Catalog**: `College`, `Course`, `Placement`, `Review`
- **Admissions**: `Cutoff`, `CapRoundTrend`, `SeatMatrix`
- **Counselling**: `AdmissionDeadline`, `SpotRoundNotice`, `SpotApplication`
- **Identity**: `User`, `Account`, `Session`, `VerificationToken`
- **Portal**: `SavedCollege`, `ApplicationTracker`, `PeerConnectRequest`, `Notification`
- **Community**: `ForumPost`, `ForumComment`, `ForumVote`, `CampusInsight`
- **Mentoring**: `MentorSlot`, `Booking`

For the full definition, see `prisma/schema.prisma`.

Notable constraints: unique `(userId, collegeId)` on saves, unique `(collegeId, year, exam, category, branch)` on trends, nullable-unique `(userId, dedupeKey)` on notifications for idempotent alert generation, unique `(slotId)` bookings enforced by conditional-update claims.

---

## Testing

```bash
pnpm verify       # tsc + selfcheck + Vitest (required before every commit)
pnpm build        # production build
pnpm ingest --source fixture-2025 --file scripts/ingest/fixtures/dte-2025.json --dry-run
pnpm backtest     # fixture calibration report
pnpm backtest --db
pnpm eval:ask     # 100-query slot/citation eval
pnpm e2e          # Playwright (needs a seeded DATABASE_URL)
```

Four assert-based suites cover the pure logic layer — no framework, no fixtures:

| Suite | Coverage |
|-------|----------|
| `predict-core` | ±2.0 band boundaries (inclusive edges), latest-round dedupe ordering, zero-match score honesty, 95-cap saturation |
| `simulator` | Descending-order acceptance, inversion detection index, duplicate flagging, allotment walk hit/miss |
| `probability` | Higher-percentile dominance, round monotonicity, OTH-quota penalty, best-round selection at boundary |
| `scholarships` | Income gating, category restrictions, EBC half-waiver above ₹2.5 LPA, best-waiver-no-stacking math |

Vitest additionally covers provenance, normalization, fuzzy matching, the ingestion fixture
(100 rows parsed, 95% matched), the probability model (12 tests), the rules parser, and a guard that
fails if `Math.random` appears in `lib/cron-sync.ts` or `lib/data/**`.

Integration verification runs the full stack against Postgres: route guards (401/403), admin review,
cron gates, rate-limiter bursts, and seeded-data smoke tests. CI starts a Postgres service, applies
`prisma db push`, seeds, and runs the three Playwright specs.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/colleges` | Filtered, paginated listing (Zod-bounded) |
| GET | `/api/colleges/[id]` | Full profile with all relations |
| POST | `/api/predict` | Safe/Target/Reach matching vs cutoffs |
| POST | `/api/predict/probability` | Logistic % allotment chance per round |
| GET | `/api/simulator` | Deduped cutoff pool per exam/category |
| GET | `/api/compare?ids=` | 2–3 college comparison payload |
| GET | `/api/locations` | Distinct location filter options |
| GET | `/api/deadlines` | Upcoming admission timeline events |
| GET | `/api/spot-notices` | Open institute-level vacancy feed |
| GET/POST | `/api/user/shortlist` (+`[id]`) | Saved-college CRUD (401-guarded, ownership-first) |
| GET/POST | `/api/user/spot-applications` | Spot application status upsert |
| GET/PATCH | `/api/user/notifications` | Feed + unread count · mark-as-read |
| GET/POST | `/api/mentors/slots` | List/create guidance slots |
| POST | `/api/mentors/book` | Atomic slot claim (409 on contention) |
| GET/POST | `/api/forum` (+`[postId]`, `vote`) | Q&A posts, replies, transactional upvote toggle |
| GET/POST | `/api/peer-connect` | Moderated senior-question requests |
| GET | `/api/distance` | Transit/drive estimates via Distance Matrix |
| GET | `/api/google-places` (+`photo`) | Campus data · key-safe media proxy |
| GET | `/api/places/nearby` | Station/PG/mess landmark probes |
| POST | `/api/analytics/event` | Public telemetry sink (rate-limited) |
| POST | `/api/ask` | Natural-language query → deterministic answer + citations |
| POST | `/api/leads` | Counsellor lead (rate-limited, Resend fallback) |
| POST | `/api/feedback` | Pilot feedback capture |
| GET | `/api/share-card/[collegeId]` | 1080×1350 PNG chance card |
| GET | `/api/cron/sync-cutoffs` | Bearer-gated deterministic sync |
| GET | `/api/cron/ingest` | Bearer-gated fetch → staging (no publish) |
| PATCH | `/api/admin/staging/[id]` | Admin approve/reject staging row |
| PATCH | `/api/admin/leads/[id]` | Admin lead status update |
| * | `/api/auth/[...nextauth]` | Auth.js handlers |

---

## Deploy

Any Node.js 18+ host works — Railway, Render, Cloudflare, Fly.io, or containerized anywhere.

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma db push
pnpm run db:seed        # optional — replaces catalog
pnpm build
pnpm start
```

Point your platform's environment variables at the [.env table above](#environment-variables). Schedule `GET /api/cron/sync-cutoffs` from any external scheduler with the `Authorization: Bearer $CRON_SECRET` header (e.g. every 6 hours) to keep cutoff trends, cutoffs, and spot notices fresh.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Contributing

1. Fork the Repository
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'Add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### PR Guidelines

- Title format: `[CampusScope] <Description>`
- Run `pnpm exec tsc --noEmit` and `pnpm check` before committing
- Ensure `pnpm build` passes
- Do not commit `.env` or secrets
- No comments in code unless requested

---

## License

Distributed under the MIT License.

---

## Author

**Vishwesh Penkar**

B.Tech Artificial Intelligence & Machine Learning

Mumbai University, India

---

<div align="center">

**Admissions generate noise. CampusScope makes it decidable.**

</div>
