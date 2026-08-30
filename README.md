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

<br>

**Search colleges. Read the real cutoffs. Simulate your CAP rounds.**
**Get percentile-matched recommendations, seat matrices, financial breakdowns, and senior insights — all from one database-backed catalog.**

<br>

**[Get Started](#-getting-started)** · **[Architecture](#-architecture)** · **[Features](#-features)** · **[API](#-api-endpoints)** · **[Deploy](#-deploy)** · **[Contributing](docs/CONTRIBUTING.md)**

</div>

---

<br>

## Table of Contents

- [Problem](#problem)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database](#database)
- [Testing](#testing)
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
✅ 4 Self-Check Suites Via `pnpm check`

---

## Tech Stack

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
   pnpm exec prisma db push   # create schema
   pnpm run db:seed           # 34 colleges, 2700 cutoffs, trends, seats, forum, mentors
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
| `ADMIN_EMAILS` | Comma-separated allow-list for `/admin/analytics` |

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

| Model Group | Models | Purpose |
|-------------|--------|---------|
| Catalog | `College` · `Course` · `Placement` · `Review` | Core listing + profile data |
| Admissions | `Cutoff` · `CapRoundTrend` · `SeatMatrix` | Round-wise closing percentiles, quota splits |
| Counselling | `AdmissionDeadline` · `SpotRoundNotice` · `SpotApplication` | Timeline, vacancies, candidate tracking |
| Identity | `User` · `Account` · `Session` · `VerificationToken` | Auth.js-managed identity |
| Portal | `SavedCollege` · `ApplicationTracker` · `PeerConnectRequest` · `Notification` | Shortlists, requests, alerts |
| Community | `ForumPost` · `ForumComment` · `ForumVote` · `CampusInsight` | Q&A board, senior notes |
| Mentoring | `MentorSlot` · `Booking` | Guidance calls, race-safe claims |
| Ops | `AnalyticsEvent` | Generic telemetry (search/docs/simulator/cron) |

Notable constraints: unique `(userId, collegeId)` on saves, unique `(collegeId, year, exam, category, branch)` on trends, nullable-unique `(userId, dedupeKey)` on notifications for idempotent alert generation, unique `(slotId)` bookings enforced by conditional-update claims.

---

## Testing

```bash
pnpm check        # run all self-check suites
```

Four assert-based suites cover the pure logic layer — no framework, no fixtures:

| Suite | Coverage |
|-------|----------|
| `predict-core` | ±2.0 band boundaries (inclusive edges), latest-round dedupe ordering, zero-match score honesty, 95-cap saturation |
| `simulator` | Descending-order acceptance, inversion detection index, duplicate flagging, allotment walk hit/miss |
| `probability` | Higher-percentile dominance, round monotonicity, OTH-quota penalty, best-round selection at boundary |
| `scholarships` | Income gating, category restrictions, EBC half-waiver above ₹2.5 LPA, best-waiver-no-stacking math |

Integration verification additionally runs the full stack against Neon: route guards (401/403), cron gate, rate-limiter bursts, and seeded-data smoke tests.

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
| GET | `/api/cron/sync-cutoffs` | Bearer-gated data pipeline (403 otherwise) |
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
