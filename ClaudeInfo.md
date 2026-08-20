# ClaudeInfo.md — CampusScope Codebase Analysis

> Complete analysis of the CampusScope project by Claude. Generated on 2026-08-20.

---

## 1. Project Overview

**CampusScope** is a college discovery platform for researching Indian engineering colleges. It is a Track A MVP covering discovery filters, college detail pages, side-by-side comparison, and an explainable shortlist predictor.

- **Name**: CampusScope (package name: `my-project`)
- **Version**: 0.1.0
- **Generator**: v0.app
- **Tagline**: "Make a better college shortlist"

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.0 (App Router) |
| Language | TypeScript 5.7.3 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4.3.3, `tw-animate-css`, `class-variance-authority` |
| Component Library | shadcn (base-nova style, using `@base-ui/react` primitives) |
| Icons | lucide-react 1.16.0 |
| ORM | Prisma 6.19.3 (`@prisma/client`) |
| Database | PostgreSQL (Neon) via `DATABASE_URL` |
| Validation | Zod 4.4.3 |
| Analytics | `@vercel/analytics` 1.6.1 |
| Build/Dev | pnpm, `tsx` (for seed script) |
| CSS Processing | PostCSS with `@tailwindcss/postcss` |

---

## 3. Directory Structure

```
Campus Scope/
├── app/
│   ├── api/
│   │   ├── colleges/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # GET college by ID
│   │   │   └── route.ts             # GET paginated college list
│   │   ├── compare/
│   │   │   └── route.ts             # GET compare data for 2-3 colleges
│   │   ├── locations/
│   │   │   └── route.ts             # GET distinct locations
│   │   └── predict/
│   │       └── route.ts             # POST predictor endpoint
│   ├── college/
│   │   └── [id]/
│   │       └── page.tsx             # College detail page (SSR)
│   ├── compare/
│   │   └── page.tsx                 # Compare page (client)
│   ├── globals.css                  # Tailwind + theme variables
│   ├── layout.tsx                   # Root layout (fonts, metadata, analytics)
│   └── page.tsx                     # Homepage
├── components/
│   ├── ui/
│   │   └── button.tsx              # shadcn Button component
│   ├── app-shell.tsx               # Header + CompareProvider wrapper
│   ├── college-card.tsx            # Card for college list items
│   ├── college-detail.tsx          # Full college profile view
│   ├── college-explorer.tsx        # Filterable college directory
│   ├── compare-context.tsx         # React Context for compare state
│   ├── compare-tray.tsx            # Floating compare tray (bottom bar)
│   └── predictor.tsx               # Shortlist predictor form + readout
├── lib/
│   ├── demo-data.ts                # Fallback demo dataset (3 colleges)
│   ├── format.ts                   # INR, package, rating formatters
│   ├── prisma.ts                   # Prisma singleton (globalThis pattern)
│   ├── types.ts                    # TypeScript type definitions
│   ├── utils.ts                    # cn() utility (clsx + tailwind-merge)
│   └── validation.ts               # Zod schemas + error helpers
├── prisma/
│   ├── schema.prisma               # Database schema (4 models)
│   └── seed.ts                     # Seed script (35 colleges)
├── public/                         # Static assets (icons, placeholders)
├── components.json                 # shadcn configuration
├── DECISIONS.md                    # Architecture decision records
├── next.config.mjs                 # Next.js config + security headers
├── package.json                    # Dependencies and scripts
├── pnpm-lock.yaml                  # Lock file
├── postcss.config.mjs              # PostCSS config
├── tsconfig.json                   # TypeScript config
└── README.md                       # Project documentation
```

---

## 4. Database Schema (Prisma)

### 4.1 Models

#### `College`
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `name` | String | Indexed |
| `location` | String | Indexed, composite index with `fees` |
| `fees` | Int | Annual fee in INR |
| `rating` | Float | 0–5 scale, indexed |
| `overview` | String | Text description |
| `createdAt` | DateTime | Default `now()` |
| `courses` | Course[] | Relation |
| `placements` | Placement[] | Relation |
| `reviews` | Review[] | Relation |

**Indexes**: `[name]`, `[location]`, `[location, fees]`, `[rating]`

#### `Course`
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `collegeId` | Int | FK → College (Cascade delete) |
| `name` | String | e.g., "Computer Science & Engineering" |
| `duration` | String | e.g., "4 years" |
| `fees` | Int | Course-specific fees |

**Indexes**: `[collegeId]`

#### `Placement`
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `collegeId` | Int | FK → College (Cascade delete) |
| `year` | Int | e.g., 2024 |
| `avgPackage` | Float | Average package in INR |
| `highestPackage` | Float | Highest package in INR |
| `placementRate` | Float | Percentage |

**Indexes**: `[collegeId, year]`

#### `Review`
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `collegeId` | Int | FK → College (Cascade delete) |
| `author` | String | Reviewer name |
| `rating` | Float | 0–5 |
| `comment` | String | Review text |
| `createdAt` | DateTime | Default `now()` |

**Indexes**: `[collegeId]`

### 4.2 Seed Data
- 35 Indian engineering colleges seeded via `prisma/seed.ts`
- Includes IITs, NITs, BITS, VIT, private universities
- Varied locations, fees (₹95K–₹580K), ratings (3.6–4.9)
- Sparse related records (every 11th college has no courses/placements; every 7th has no reviews)
- Each non-sparse college gets 3 courses, 2 placement years, and 2 reviews

---

## 5. API Routes

### 5.1 `GET /api/colleges`
**Purpose**: Paginated, filtered college listing.

**Query Parameters** (validated via `collegeQuerySchema`):
| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | Search name or location (case-insensitive) |
| `location` | string | — | Filter by location (case-insensitive) |
| `minFee` | integer | — | Minimum fee in INR |
| `maxFee` | integer | — | Maximum fee in INR |
| `minRating` | number | — | Minimum rating (0–5) |
| `page` | integer | 1 | Page number |
| `pageSize` | integer | 12 | Results per page (max 50) |

**Response**:
```json
{
  "data": [CollegeCard],
  "meta": { "total": number, "page": number, "pageSize": number, "totalPages": number },
  "source": "preview-demo" // only when using fallback data
}
```

**Fallback**: If Prisma fails, returns filtered demo data with `source: 'preview-demo'`.

### 5.2 `GET /api/colleges/:id`
**Purpose**: Full college detail with courses, placements, reviews.

**Params**: `id` (validated via `collegeIdSchema` — positive integer)

**Response**: `CollegeDetail` object with `courses[]`, `placements[]`, `reviews[]`.

**Fallback**: Falls back to demo data if DB unavailable. Returns `source: 'preview-demo'` and a `warning` field.

### 5.3 `GET /api/compare?ids=1,2`
**Purpose**: Side-by-side comparison data for 2–3 colleges.

**Query Parameters**: `ids` — comma-separated college IDs (validated via `compareIdsSchema`)

**Validation Rules**:
- Minimum 2 IDs, maximum 3
- All IDs must be unique
- All IDs must exist in the database

**Response**:
```json
{
  "data": [CollegeDetail]  // ordered as provided in `ids`
}
```

**Error Responses**:
- 400: Invalid IDs, duplicate IDs, missing colleges
- 500: Unexpected errors

### 5.4 `GET /api/locations`
**Purpose**: Distinct location values for the filter dropdown.

**Response**:
```json
{
  "data": ["Ahmedabad", "Bengaluru", "Chennai", ...],
  "source": "preview-demo" // only when using fallback
}
```

### 5.5 `POST /api/predict`
**Purpose**: Directional shortlist predictor.

**Request Body**:
```json
{
  "rank": number,        // 1–100,000 (entrance rank)
  "budget": number,      // 1–100 (annual tuition in lakhs)
  "location": string     // optional, max 80 chars
}
```

**Scoring Algorithm**:
```
selectivity = clamp((100000 - rank) / 100000, 0, 1)   // weight: 0.55
budgetFit   = clamp(budget / 12, 0, 1)                 // weight: 0.35
locationFit = (location ? 0.08 : 0)                    // weight: added directly
score       = round((selectivity * 0.55 + budgetFit * 0.35 + locationFit) * 100)
score       = clamp(score, 18, 94)
```

**Bands**:
| Score | Band |
|---|---|
| ≥ 70 | "Strong match" |
| ≥ 45 | "Worth exploring" |
| < 45 | "Stretch shortlist" |

**Response**:
```json
{
  "data": {
    "score": number,
    "band": string,
    "assumptions": [string, string, string]
  }
}
```

---

## 6. Frontend Pages

### 6.1 Homepage (`/`)
- Hero section with editorial typography (Newsreader serif + DM Sans body)
- Two CTAs: "Start with the directory" and "See your starting point"
- `<CollegeExplorer />` — filterable directory with search, location, fee range, rating filters
- `<Predictor />` — shortlist predictor with rank/budget/city inputs

### 6.2 College Detail (`/college/[id]`)
- SSR page that passes `id` to `<CollegeDetail />` client component
- Tabs: Overview, Courses, Placements, Reviews
- Add to compare functionality
- Error/retry states

### 6.3 Compare (`/compare?ids=1,2`)
- Client-side page reading IDs from URL search params
- Side-by-side comparison table
- Metrics: Fees, Rating, Avg Package, Highest Package, Placement Rate, Courses, Reviews
- Empty/error/loading states

---

## 7. Components

### 7.1 `AppShell` (`components/app-shell.tsx`)
- Wraps children in `<CompareProvider>`
- Header with logo (GraduationCap icon), nav links (Explore, Predictor, Compare)
- Renders `<CompareTray />` at bottom

### 7.2 `CollegeExplorer` (`components/college-explorer.tsx`)
- State: `Filters` type with `q`, `location`, `minFee`, `maxFee`, `minRating`, `page`
- Reads initial filters from URL search params
- Syncs filter state to URL via `history.replaceState`
- Fetches `/api/locations` on mount for location dropdown
- Renders filter form, college cards grid, pagination
- Loading skeleton, error state with retry, empty state

### 7.3 `CollegeCard` (`components/college-card.tsx`)
- Displays college name, location, rating, fees, overview
- Link to `/college/[id]`
- "Add to compare" toggle button using `useCompare()`

### 7.4 `CollegeDetail` (`components/college-detail.tsx`)
- Fetches `/api/colleges/:id` on mount
- Tabbed interface (Overview, Courses, Placements, Reviews)
- Displays courses table, placement history, student reviews
- Add to compare button

### 7.5 `Predictor` (`components/predictor.tsx`)
- Form with rank, budget, location inputs
- POSTs to `/api/predict`
- Displays score (out of 100), band, assumptions
- Reset functionality

### 7.6 `CompareProvider` (`components/compare-context.tsx`)
- React Context for compare state
- `items: CompareItem[]` — up to 3 colleges
- `toggle(item)` — add/remove from comparison
- `remove(id)` — remove by ID
- `go()` — navigate to `/compare?ids=...`

### 7.7 `CompareTray` (`components/compare-tray.tsx`)
- Fixed bottom bar when items are selected
- Shows selected college names with remove buttons
- "Compare" button (enabled when ≥ 2 items)
- "Add N more" hint when < 3 items

### 7.8 `Button` (`components/ui/button.tsx`)
- shadcn component using `@base-ui/react` Button primitive
- Variants: default, outline, secondary, ghost, destructive, link
- Sizes: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg

---

## 8. Library Utilities

### 8.1 `lib/types.ts`
```typescript
CollegeCard       // { id, name, location, fees, rating, overview, _count? }
CollegeDetail     // CollegeCard + { courses[], placements[], reviews[] }
CollegeListResponse // { data: CollegeCard[], meta: { total, page, pageSize, totalPages }, source? }
CompareResponse   // { data: CollegeDetail[], source? }
```

### 8.2 `lib/format.ts`
- `formatINR(value)` — formats INR with ₹ symbol, lakhs notation
- `formatPackage(value)` — formats placement package as "₹X L / yr"
- `formatRating(value)` — formats rating to 1 decimal place

### 8.3 `lib/validation.ts`
- `collegeIdSchema` — positive integer
- `collegeQuerySchema` — full query validation with minFee ≤ maxFee refinement
- `compareIdsSchema` — array of 2–3 unique positive integers
- `errorResponse(error, status, details?)` — standardized JSON error response
- `parseSearchParams(request)` — extract search params from Request
- `parseCompareIds(request)` — extract and split comma-separated IDs

### 8.4 `lib/prisma.ts`
- `globalThis` singleton pattern to prevent connection exhaustion during hot reload
- Exports `prisma` PrismaClient instance

### 8.5 `lib/demo-data.ts`
- 3 colleges: IIT Bombay, BITS Pilani, VIT Vellore
- Complete data with courses, placements, reviews
- Used as fallback when database is unavailable

### 8.6 `lib/utils.ts`
- `cn(...inputs)` — merges Tailwind classes via `clsx` + `tailwind-merge`

---

## 9. Design System

### 9.1 Typography
- **Display/Headings**: Newsreader (serif) — `--font-newsreader`
- **Body**: DM Sans (sans-serif) — `--font-dm-sans`
- **Eyebrow**: 10px, bold, uppercase, 0.2em tracking, primary color

### 9.2 Color Tokens (Light Mode)
| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.965 0.018 82)` | Page background (warm paper tone) |
| `--foreground` | `oklch(0.22 0.035 255)` | Primary text (ink/navy) |
| `--primary` | `oklch(0.32 0.09 242)` | Brand blue/teal |
| `--primary-foreground` | `oklch(0.985 0.012 82)` | Text on primary |
| `--card` | `oklch(0.985 0.012 82)` | Card background |
| `--muted-foreground` | `oklch(0.556 0 0)` | Secondary text |
| `--border` | `oklch(0.922 0 0)` | Borders |

### 9.3 Color Tokens (Dark Mode)
| Token | Value |
|---|---|
| `--background` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.922 0 0)` |
| `--card` | `oklch(0.205 0 0)` |

### 9.4 Design Principles
- Editorial admissions research direction
- Restrained borders (`border-foreground/10`)
- No decorative gradients
- Paper-toned backgrounds
- Ink/navy brand color
- Responsive: mobile-first with `lg:` breakpoints
- Smooth scroll behavior

---

## 10. State Management

### 10.1 Compare State (Client-Side)
- **Context**: `CompareProvider` + `useCompare()` hook
- **Storage**: React `useState` (session-only, not persisted)
- **Max items**: 3 colleges
- **URL as source of truth**: Compare page reads IDs from `?ids=` param

### 10.2 Filter State (URL-Synced)
- `CollegeExplorer` reads/writes filters to URL search params
- `history.replaceState()` for URL updates without navigation
- Initial state hydrated from `window.location.search`

---

## 11. Error Handling

### 11.1 API Error Format
```json
{
  "error": "string",
  "details": {} // optional, Zod error flattened or missing IDs
}
```

### 11.2 Status Codes
| Code | Usage |
|---|---|
| 400 | Invalid query parameters, invalid IDs, duplicate IDs, missing colleges |
| 404 | College not found |
| 500 | Unexpected server errors |

### 11.3 Client-Side Error States
- `CollegeExplorer`: Error card with "Try again" button
- `CollegeDetail`: Error screen with retry
- `Predictor`: Alert message on failure
- `CompareContent`: Error message display

---

## 12. Security

### 12.1 Security Headers (next.config.mjs)
```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: SAMEORIGIN
```

### 12.2 Input Validation
- All API inputs validated with Zod schemas before processing
- Query parameters coerced and bounded (e.g., `pageSize` max 50)
- `collegeIdSchema` ensures positive integers only

### 12.3 Environment
- `.env*.local` in `.gitignore`
- No secrets committed
- `DATABASE_URL` provided via environment

---

## 13. Build & Deployment

### 13.1 Scripts
| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `db:push` | `prisma db push` |
| `db:seed` | `tsx prisma/seed.ts` |

### 13.2 Deployment Steps
1. Install dependencies with `pnpm`
2. Set `DATABASE_URL` for Neon/Postgres
3. Run `pnpm prisma generate`
4. Run `pnpm build`
5. Verify routes: `/`, `/college/1`, `/compare?ids=1,2`, `/api/colleges`, `/api/predict`

### 13.3 Production Checklist
- Expand catalog with authoritative data
- Add automated route tests
- Document predictor model and validation dataset
- Keep `DECISIONS.md` current
- Add security headers and monitoring

---

## 14. Key Design Decisions (from DECISIONS.md)

1. **MVP Scope**: Four workflows — discovery, college detail, comparison, predictor. No auth or saved colleges.
2. **Database**: Prisma ORM over PostgreSQL/Neon via `DATABASE_URL`. Production source of truth.
3. **Demo Fallback**: `lib/demo-data.ts` with `source: 'preview-demo'` marker when DB unavailable.
4. **Predictor**: Deliberately directional and explainable. Score bands, not admission guarantees.
5. **Compare State**: Client-side React Context only. URL is source of truth for shared/refreshable comparison.
6. **Prisma Singleton**: `globalThis` pattern in `lib/prisma.ts` to prevent hot-reload connection exhaustion.
7. **Pagination**: Default 12 results/page, max 50 client-controlled.
8. **Seed Data**: 35 colleges with varied attributes to exercise filters and empty states.

---

## 15. Dependencies

### Production
| Package | Version | Purpose |
|---|---|---|
| `@base-ui/react` | ^1.5.0 | Button primitive for shadcn |
| `@prisma/client` | ^6.19.3 | Database ORM client |
| `@vercel/analytics` | 1.6.1 | Production analytics |
| `class-variance-authority` | ^0.7.1 | Component variant management |
| `clsx` | ^2.1.1 | Conditional classnames |
| `lucide-react` | ^1.16.0 | Icon library |
| `next` | 16.3.0 | React framework |
| `prisma` | ^6.19.3 | Database CLI |
| `react` | ^19 | UI library |
| `react-dom` | ^19 | React DOM renderer |
| `shadcn` | ^4.8.0 | Component system |
| `tailwind-merge` | ^3.3.1 | Tailwind class deduplication |
| `tw-animate-css` | ^1.4.0 | Tailwind animations |
| `zod` | ^4.4.3 | Schema validation |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `@tailwindcss/postcss` | ^4.3.3 | Tailwind PostCSS plugin |
| `@types/node` | ^24 | Node.js type definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |
| `postcss` | ^8.5 | CSS processing |
| `tailwindcss` | ^4.3.3 | Utility-first CSS |
| `tsx` | ^4.23.12 | TypeScript execution (seed script) |
| `typescript` | 5.7.3 | TypeScript compiler |

### pnpm Overrides
- `hono`: 4.12.25

---

## 16. Route Map

### Pages
| Route | Component | Description |
|---|---|---|
| `/` | `page.tsx` → `CollegeExplorer` + `Predictor` | Homepage with directory and predictor |
| `/college/[id]` | `page.tsx` → `CollegeDetail` | College profile page |
| `/compare` | `page.tsx` → `CompareContent` | Side-by-side comparison (reads `?ids=`) |

### API
| Route | Method | Purpose |
|---|---|---|
| `/api/colleges` | GET | Paginated college listing |
| `/api/colleges/:id` | GET | College detail |
| `/api/compare` | GET | Compare 2–3 colleges |
| `/api/locations` | GET | Distinct location list |
| `/api/predict` | POST | Shortlist predictor |

---

## 17. Component Relationships

```
AppShell
├── CompareProvider (Context)
│   ├── Header (Logo, Nav)
│   ├── {children} (Page content)
│   └── CompareTray (Fixed bottom bar)

Homepage (page.tsx)
├── AppShell
│   ├── Hero Section
│   ├── CollegeExplorer
│   │   ├── Filter Form
│   │   └── CollegeCard[] (grid)
│   │       └── useCompare() toggle
│   └── Predictor
│       └── POST /api/predict

College Detail (college/[id]/page.tsx)
├── AppShell
│   └── CollegeDetail
│       ├── Overview Tab
│       ├── Courses Tab
│       ├── Placements Tab
│       ├── Reviews Tab
│       └── useCompare() toggle

Compare (compare/page.tsx)
├── AppShell
│   └── CompareContent
│       └── Comparison Table
```

---

## 18. Data Flow

### Discovery Flow
1. User visits `/` → `CollegeExplorer` mounts
2. Reads filters from URL search params
3. Fetches `/api/locations` for location dropdown
4. Fetches `/api/colleges?q=&location=&minFee=&maxFee=&minRating=&page=`
5. Renders `CollegeCard[]` in grid with pagination
6. User can add colleges to compare via `useCompare().toggle()`
7. `CompareTray` appears at bottom with selected items

### Comparison Flow
1. User clicks "Compare" in `CompareTray`
2. Navigates to `/compare?ids=1,2,3`
3. `CompareContent` reads IDs from URL
4. Fetches `/api/compare?ids=1,2,3`
5. Renders side-by-side comparison table

### Predictor Flow
1. User enters rank, budget, optional city
2. POSTs to `/api/predict`
3. Server calculates score using weighted formula
4. Returns score (18–94), band, and assumptions
5. Displays readout with explanation

---

## 19. Known Limitations

1. **No Authentication**: User sessions are not persisted
2. **No Saved Colleges**: Compare state is lost on page refresh
3. **Heuristic Predictor**: Not based on real admission data
4. **Small Demo Dataset**: Only 3 colleges in fallback mode
5. **No Tests**: No automated route or component tests
6. **No Dark Mode Toggle**: System-preference only, no manual toggle
7. **No Image Optimization**: `images.unoptimized: true`

---

## 20. File Inventory

| File | Lines | Purpose |
|---|---|---|
| `app/layout.tsx` | 53 | Root layout with fonts and metadata |
| `app/page.tsx` | 14 | Homepage |
| `app/globals.css` | 165 | Theme variables and base styles |
| `app/college/[id]/page.tsx` | 3 | College detail page (SSR) |
| `app/compare/page.tsx` | 7 | Compare page (client) |
| `app/api/colleges/route.ts` | 32 | College listing API |
| `app/api/colleges/[id]/route.ts` | 30 | College detail API |
| `app/api/compare/route.ts` | 15 | Compare API |
| `app/api/locations/route.ts` | 15 | Locations API |
| `app/api/predict/route.ts` | 24 | Predictor API |
| `components/app-shell.tsx` | 28 | App shell with header |
| `components/college-card.tsx` | 28 | College card component |
| `components/college-detail.tsx` | 8 | College detail component |
| `components/college-explorer.tsx` | 71 | College directory with filters |
| `components/compare-context.tsx` | 13 | Compare state context |
| `components/compare-tray.tsx` | 5 | Compare tray (bottom bar) |
| `components/predictor.tsx` | 18 | Predictor form and readout |
| `components/ui/button.tsx` | 58 | shadcn Button component |
| `lib/demo-data.ts` | 5 | Fallback demo dataset |
| `lib/format.ts` | 12 | Formatting utilities |
| `lib/prisma.ts` | 7 | Prisma singleton |
| `lib/types.ts` | 26 | TypeScript type definitions |
| `lib/utils.ts` | 6 | cn() utility |
| `lib/validation.ts` | 39 | Zod schemas and helpers |
| `prisma/schema.prisma` | 61 | Database schema |
| `prisma/seed.ts` | 32 | Seed script |
| `next.config.mjs` | 16 | Next.js configuration |
| `postcss.config.mjs` | 8 | PostCSS configuration |
| `tsconfig.json` | 33 | TypeScript configuration |
| `package.json` | 43 | Project metadata and dependencies |
| `components.json` | 21 | shadcn configuration |

---

*End of analysis. This document contains everything identified in the CampusScope codebase.*
