# Launch status

Updated 18 Nov 2026.

## Ready

- 353,853 official cutoff rows from 28 DTE / State CET Cell PDFs, 2023–2026, CET + JEE, CAP rounds 1–4.
- 402 institutes with campus photos (16 source-verified Commons matches, 386 explicitly labelled illustrative); 61,123 derived trend rows; 2,262 seat-matrix rows.
- Official institute-code matching; no fuzzy college matching in the main pipeline.
- 0 rows missing source/out of range; 252 duplicate groups.
- 63 automated tests + 4 Playwright specs, all green.
- Production build + `next start` verified against a real PostgreSQL database.
- Predictor, Ask, option form, compare, shortlist, correction queue, admin review, methodology,
  privacy/terms/about, sitemap/robots/OG image.
- Security headers, private cache for sensitive APIs, rate limiting, Sentry hook, health check.

## Blocked on accounts/keys

| Item | Needed |
|---|---|
| Production database | Neon `DATABASE_URL` |
| Deploy | Vercel project/token |
| Sign-in | Google OAuth client ID/secret |
| Ask provider | Gemini API key |
| Production rate limiting | Upstash REST URL/token |
| Error monitoring | Sentry DSN |
| Magic links / lead email | Resend API key + verified domain |

## Known limitations

- Fees, placements, reviews, and scholarships are not verified; the UI hides/marks them.
- JEE / All-India cutoffs are ingested for 2023–2026; higher-volume JEE Advanced data is not.
- The year-over-year carry-forward MAE is ~12 percentile points; probabilities are directional.
- Payments, WhatsApp alerts, and a paid counsellor marketplace are v2.
- No legal review of beta privacy/terms yet.
