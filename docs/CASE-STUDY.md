# Case study: building a cited admissions intelligence platform

## Problem

Maharashtra engineering aspirants make a high-stakes choice from PDFs, scattered portals, and
hearsay. Most college sites show numbers without provenance. A student cannot tell whether a cutoff
is official, which round it belongs to, or whether it was scraped from a forum.

## What CampusScope does

CampusScope turns official DTE / State CET Cell CAP cutoff PDFs into:

- a searchable directory of **402 DTE institutes**;
- **353,853 official cutoff rows** across **2023–2026**, CAP rounds 1–4, categories, levels, and stages;
- a **cited predictor** that returns a balanced Safe / Target / Reach shortlist;
- a **cited Ask** interface with editable slots and deterministic calculations;
- a **practice option form** with CSV export;
- five educational guides with FAQ structured data and internal links to the tools;
- a **data trust center** with source documents, page citations, correction reports, and coverage metrics;
- a **chance card** PNG and a counsellor lead path;
- a lazy-loaded **Three.js data constellation** that pauses offscreen and respects reduced motion.

## Architecture

```text
Official DTE CAP PDFs
        |
        v
pdftotext -layout  ->  parser (institute code, branch code, category, round, stage, rank, percentile)
        |
        v
validation + source hash + page number
        |
        v
Neon Postgres: College / Cutoff / SourceDocument / CapRoundTrend
        |
        +--> predictor (latest-year dedupe, Safe/Target/Reach mix, citations)
        +--> ask (Gemini slot extraction -> deterministic engine -> citations)
        +--> college profiles + 3-year trend explorer
        +--> methodology / correction queue / admin review
        |
        v
Next.js 16 on Vercel
```

## Data engineering

The hard part was not the UI; it was making the PDFs trustworthy.

- 2024, 2025, and 2026 PDFs use different layouts.
- Header codes combine gender (`G`/`L`), category, and level (`H`/`O`/`S`), e.g. `GSCH`, `GOPENO`, `LNT2S`.
- Rows include special stages (`I-Non PWD`, `I-Non Defence`) and minority `MH` rows.
- Some category cells are blank, so rank and percentile tokens must be mapped by column position,
  not by zip order.
- The same branch name can appear under multiple choice codes (`K`, `L` suffixes).

The parser normalizes all of this, validates percentile ranges, and keeps source page numbers.
College matching uses official DTE institute codes instead of fuzzy names.

## Results

| Metric | Result |
|---|---:|
| Official cutoff rows | 353,853 |
| DTE institutes | 402 |
| Source PDFs | 28 |
| Admission years | 4 |
| Derived trend rows | 61,123 |
| Seat-matrix rows | 2,262 |
| Rows missing source/out of range | 0 |
| Duplicate groups | 252 (301 extra rows) |
| Unit/integration tests | 66 |
| Playwright specs | 11 |
| Lighthouse college profile | 91 performance / 98 accessibility |
| Brier score (official dataset) | 0.0817 |
| Log loss | 0.2813 |
| Year-over-year carry-forward MAE | 11.89 percentile points |

The carry-forward MAE is intentionally reported: it is a warning against pretending the product can
forecast next year's cutoff. The app labels probabilities as directional.

## Engineering decisions

- **Citations over confidence.** Every cutoff result carries a source URL and page.
- **Deterministic calculations.** Gemini extracts slots; code computes cutoff/chance.
- **No demo fallback in production.** If the catalog fails, the app returns an honest 503.
- **Hide unverified data.** Fees, placements, and reviews are shown only when sourced; otherwise the
  profile says "not verified".
- **Small, testable modules.** `lib/data/dte.ts` is pure and covered by page-level fixtures.
- **Operational safety.** CSP/HSTS, private cache on sensitive APIs, Upstash-compatible rate limiting,
  Sentry hook, health check, migrations, CI, and Playwright against a production build.

## What I would build next

1. Verify fee and placement data from official Fee Regulating Authority and institute reports.
2. Add other states and other entrance exams (JEE Advanced, NEET, etc.).
3. Human-verified counsellor marketplace with payments, refunds, and moderation.
4. Marathi UI and WhatsApp alerts.
5. A real forecast model with out-of-sample validation; keep the current probability as a baseline.

## Demo script

1. Home → point at 353,853 official rows and 402 institutes.
2. Explore `COEP` → open profile → Cutoffs → show 2026 Round 4, category, rank, source PDF page.
3. Predictor → 92 percentile, CET, OPEN, Computer Engineering → show 7 Safe / 7 Target / 6 Reach.
4. Ask → “85 percentile OBC CS Pune” → show editable slots and citations.
5. Option form → generate, reorder, export CSV.
6. Methodology → show source documents, pipeline, and correction queue.
7. Mobile → show navigation and cutoff table.
