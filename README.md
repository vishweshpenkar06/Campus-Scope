# CampusScope

CampusScope is a Track A college discovery platform for researching Indian engineering colleges. The MVP covers discovery filters, college detail pages, side-by-side comparison, and an explainable shortlist predictor. Advanced tooling adds CAP round analytics, seat matrices, financial planning, commute estimates, an option form generator, senior insights, ROI badges, sharing/export, and an admission deadline tracker.

## Architecture

- Next.js 16 App Router with TypeScript and Tailwind CSS.
- Prisma ORM over PostgreSQL/Neon through `DATABASE_URL`.
- API routes under `app/api` validate request input with Zod.
- The production catalog is database-backed. If the preview database is unavailable, routes use the small, clearly labeled `lib/demo-data.ts` dataset so the UI remains demonstrable.
- Compare state is client-side for the active session, while the compare page reads selected IDs from the URL.
- The interface uses an editorial research direction: Newsreader display type, DM Sans body type, paper-toned background, ink/navy brand color, restrained borders, and no decorative gradients.
- Google Places photos are proxied through `/api/google-places/photo` so API keys never reach browsers.
- PDF exports use the browser print pipeline (`window.print()` + print CSS); no PDF library is bundled.

## Key routes

- `/` — deadline tracker banner, onboarding, discovery filters, shortlist cards, and predictor.
- `/college/[id]` — college profile with academics, placements, CAP cutoff trends, seat matrix, financial breakdown, senior insights, reviews, share/PDF export, commute checker, campus map, and Ask-a-Senior.
- `/compare?ids=1,2` — comparison matrix for two or three colleges (packages, recruiters, ratios, NIRF, hostel).
- `/option-form` — CAP preference list generator with reorder plus CSV/print-PDF export.
- `/simulator` — mock option form with drag-and-drop reordering, CET Cell rule warnings, and probable seat allotment.
- `/documents` — document readiness calculator per candidate category for E-scrutiny.
- `/shortlist` — signed-in candidates manage saved colleges and application status (Google sign-in via Auth.js).
- `/spot-rounds` — live institute-level / spot-round vacancy feed.
- `/api/user/shortlist` — saved-college CRUD (auth-guarded).
- `/api/simulator?exam=&category=` — cutoff choices for the simulator pool.
- `/api/spot-notices` — vacancy notices feed.
- `/api/peer-connect` — senior-connect requests (auth-guarded).
- `/api/places/nearby?location=` — station/PG/mess landmarks around a campus.
- `/api/colleges` — validated, paginated listing.
- `/api/colleges/:id` — detail payload.
- `/api/compare?ids=1,2` — comparison payload.
- `/api/locations` — location filter options.
- `/api/predict` — directional predictor against real Cutoff records, not an admission guarantee.
- `/api/deadlines` — upcoming admission events for the homepage banner.
- `/api/distance` — travel time estimates via Google Distance Matrix (requires `GOOGLE_MAPS_API_KEY`).
- `/api/google-places` — campus photos/ratings; `/api/google-places/photo` proxies media bytes.

## Deployment handoff

1. Download this project and install dependencies with pnpm or import it with the shadcn CLI/GitHub workflow.
2. Provide `DATABASE_URL` for the Neon/Postgres database in the deployment environment. The project already contains the Prisma schema and seeded catalog structure.
3. Run `pnpm prisma generate`, then `pnpm build` before deploying. Run the existing seed only when intentionally replacing the catalog.
4. Do not commit `.env` files, database URLs, or generated secrets.
5. After deployment, verify `/`, `/college/1`, `/compare?ids=1,2`, `/api/colleges`, and `/api/predict`.

## Handoff checklist

1. Expand the catalog with authoritative college data and update provenance copy.
2. Add automated route tests for invalid filters, missing colleges, compare limits, and predictor boundaries.
3. Add a documented statistical model and validation dataset before replacing the predictor heuristic.
4. Keep `DECISIONS.md` current when changing the database, compare state, or predictor assumptions.

## Verification

The project passes Prisma Client generation, TypeScript checking, `next build`, `pnpm check` (predictor-logic self-check), and `git diff --check`. Browser verification covers the redesigned homepage at mobile width, live college discovery, and the IIT Delhi detail route.

> Security note: `.env` was previously committed to git history. It is now untracked and gitignored — rotate the Neon database URL and Google API keys before production use.
