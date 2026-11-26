# Resume and portfolio copy

## One-line project description

CampusScope — a data-trust-first admissions intelligence platform for Maharashtra engineering
aspirants, with 353k+ official DTE cutoff rows, cited predictions, and a rules/LLM query engine.

## Resume bullets

- Built and launched CampusScope, a Next.js 16 / React 19 / TypeScript admissions platform covering
  402 Maharashtra engineering institutes and 353,853 official DTE cutoffs across 2023–2026.
- Designed a PDF ingestion pipeline (`pdftotext -layout` + TypeScript) that normalized three different
  CAP PDF layouts, 30+ category codes, gender/level suffixes, minority rows, and special stages;
  imported 14 sourced documents with zero rows missing provenance.
- Implemented a citation-first Ask engine with Gemini slot extraction and a deterministic rules
  fallback; every answer is computed by code and carries a source URL, page, and date.
- Built a balanced Safe/Target/Reach predictor over latest-year cutoffs, plus a versioned logistic
  probability model with Brier, log-loss, and calibration reporting on the official dataset.
- Added a public data trust center, correction workflow, admin review queue, and source-document
  registry; unverified fee/placement/review data is hidden rather than shown as fact.
- Hardened production with RBAC-ready admin gates, Upstash-compatible rate limiting, CSP/HSTS,
  private cache on sensitive APIs, Sentry instrumentation, health checks, migrations, CI, and 3
  Playwright specs against a production build.

## Portfolio blurb

Most student projects stop at a CRUD dashboard. CampusScope starts with the hardest part: making
official PDFs trustworthy. It parses real DTE Maharashtra CAP cutoffs, keeps the source page for
every number, hides unverified data, and builds prediction and natural-language layers only on top
of deterministic, cited rows.

## Metrics to quote

- 353,853 official cutoff rows
- 402 DTE institutes
- 28 official source PDFs
- 4 admission years / 4 CAP rounds
- 63 automated tests + 6 Playwright specs
- Brier 0.0817 · log loss 0.2813 · carry-forward MAE 11.89 percentile points

## What not to claim

- Do not claim official DTE partnership or endorsement.
- Do not claim a guaranteed admission chance.
- Do not quote Lighthouse or pilot-user numbers until they are actually measured.
