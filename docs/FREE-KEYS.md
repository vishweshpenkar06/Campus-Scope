# Free keys and accounts

CampusScope can run with a rules-only Ask fallback and no auth. For the full beta, create these
free accounts. Put values in `.env.local` locally and in Vercel → Settings → Environment Variables.
Never commit them.

| Order | Service | Env vars | Free tier | Used for |
|---:|---|---|---|---|
| 1 | [Neon](https://neon.tech) | `DATABASE_URL` | yes | production Postgres |
| 2 | [Google AI Studio](https://aistudio.google.com/apikey) | `GEMINI_API_KEY`, optional `GEMINI_MODEL` | yes | Ask slot extraction |
| 3 | [Google Cloud OAuth](https://console.cloud.google.com/apis/credentials) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | yes | sign-in |
| 4 | [Vercel](https://vercel.com) | project access or `VERCEL_TOKEN` | yes (Hobby for preview; Pro before commercial) | deploy |
| 5 | [Sentry](https://sentry.io) | `SENTRY_DSN` | yes | errors/performance |
| 6 | [Upstash Redis](https://upstash.com) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | yes | production rate limit |
| 7 | [Resend](https://resend.com) | `RESEND_API_KEY`, `RESEND_FROM` | yes | magic links and lead email |
| 8 | Domain (optional) | `NEXT_PUBLIC_SITE_URL` | paid | custom URL |

Generate `AUTH_SECRET` locally:

```bash
openssl rand -base64 32
```

## Neon setup

1. Create a project and database.
2. Copy the pooled connection string (host contains `-pooler`).
3. Add `?sslmode=require` if it is missing.
4. Save it as `DATABASE_URL`.

Bulk ingestion is fastest with the direct/non-pooled URL. The app on Vercel should use the pooled URL.

## Google OAuth setup

1. Create an OAuth client of type **Web application**.
2. Authorised JavaScript origin: `http://localhost:3005` and your deployed origin.
3. Authorised redirect URI:
   - `http://localhost:3005/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
4. Copy the client ID and secret.

## Gemini setup

1. Create an API key in Google AI Studio.
2. Set `GEMINI_API_KEY`.
3. Optional: `GEMINI_MODEL=gemini-2.0-flash`.
4. Without it, Ask uses the deterministic rules parser and still returns citations.

## Sentry setup

1. Create a Next.js project.
2. Copy the DSN into `SENTRY_DSN`.
3. `instrumentation.ts` initialises Sentry only when the DSN is present.

## Upstash setup

1. Create a Redis database.
2. Copy the REST URL and token.
3. The current limiter is in-memory; adding Upstash is the production upgrade path.

## Resend setup

1. Create an API key.
2. For arbitrary recipients, verify a sending domain and set `RESEND_FROM`.
3. Without it, lead requests are stored and a routing notice is logged; no PII is logged.

## Vercel

1. Import the GitHub repo.
2. Add all env vars to Production (and Preview if used).
3. Build command: `pnpm build`; install command: `pnpm install --frozen-lockfile`.
4. Add the custom domain and update `NEXT_PUBLIC_SITE_URL`.
5. Keep `CRON_SECRET` set if the daily sync cron is enabled.
