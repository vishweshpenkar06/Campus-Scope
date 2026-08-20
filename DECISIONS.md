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
- Prisma uses a `globalThis` singleton in `lib/prisma.ts` to prevent hot-reload connection exhaustion.
- College listing defaults to 12 results per page and caps client-controlled page size at 50.
- Compare selection uses React Context only; the compare URL is the source of truth for refreshable/shared comparison pages.
- Seed data intentionally includes varied Indian locations, fees, ratings, and sparse related records so filters and empty states are exercised.
- API errors use `{ error, details? }` with 400 validation, 404 missing resources, and 500 unexpected errors.
