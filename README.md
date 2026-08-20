# CampusScope

CampusScope is a Track A college discovery platform for researching Indian engineering colleges. The MVP covers discovery filters, college detail pages, side-by-side comparison, and an explainable shortlist predictor.

## Architecture

- Next.js 16 App Router with TypeScript and Tailwind CSS.
- Prisma ORM over PostgreSQL/Neon through `DATABASE_URL`.
- API routes under `app/api` validate request input with Zod.
- The production catalog is database-backed. If the preview database is unavailable, routes use the small, clearly labeled `lib/demo-data.ts` dataset so the UI remains demonstrable.
- Compare state is client-side for the active session, while the compare page reads selected IDs from the URL.
- The interface uses an editorial research direction: Newsreader display type, DM Sans body type, paper-toned background, ink/navy brand color, restrained borders, and no decorative gradients.

## Key routes

- `/` — discovery, filters, shortlist cards, and predictor.
- `/college/[id]` — college profile with academics, placements, and reviews.
- `/compare?ids=1,2` — comparison table for two or three colleges.
- `/api/colleges` — validated, paginated listing.
- `/api/colleges/:id` — detail payload.
- `/api/compare?ids=1,2` — comparison payload.
- `/api/locations` — location filter options.
- `/api/predict` — directional predictor, not an admission guarantee.

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

The project passes Prisma Client generation, TypeScript checking, `next build`, and `git diff --check`. Browser verification covers the redesigned homepage at mobile width, live college discovery, and the IIT Delhi detail route.
