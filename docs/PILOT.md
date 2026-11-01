# Pilot plan and instrumentation

## Goal

Validate that real Maharashtra engineering aspirants use CampusScope to build a shortlist, trust the
cited numbers, and ask for human help when needed.

## Targets (from the improvement spec)

| Metric | Target |
|---|---:|
| Students onboarded | 50 |
| Saved shortlists | 20 |
| Ask queries | 100 |
| Counsellor leads | 5 |
| Feedback submissions | 20 |

## Where each metric lives

| Metric | Source |
|---|---|
| Ask queries | `AnalyticsEvent` where `type = 'ask'` |
| Share cards | `AnalyticsEvent` where `type = 'share-card'` |
| Leads | `Lead` rows; `AnalyticsEvent` where `type = 'lead'` |
| Shortlists | `SavedCollege` rows |
| Feedback | `Feedback` rows; `AnalyticsEvent` where `type = 'feedback'` |
| Directory searches | `AnalyticsEvent` where `type = 'search'` |
| Ingestion freshness | `StagingRecord` / verified `Cutoff` rows |

No analytics event stores a name, phone, email, percentile, or free-text query. Ask events store only
the intent label; lead/feedback events store only routing/page labels.

## Recruitment

1. Saraswati College of Engineering, Kharghar — first cohort. One 15-minute lab session.
2. Ask students to complete one real task: build a 5-college shortlist for their actual percentile.
3. Send the feedback button link after the task; do not incentivise ratings.

## Weekly review

- Data freshness: share of verified cutoff rows with `sourceDate` < 30 days.
- Ingestion: match rate and pending review age.
- Trust: count of predictor/ask results that surfaced legacy/unverified rows.
- Task completion: shortlist created vs. session started.
- Calibration: rerun `pnpm backtest --db` monthly against the production database.
- Ask quality: sample 20 real queries and spot-check slots + citations manually.

## Results template

Fill after the pilot; do not publish invented numbers.

| Week | Students | Shortlists | Ask queries | Leads | Feedback |
|---|---:|---:|---:|---:|---:|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

### Feedback themes

- Pending real submissions.

### Decisions

- Pending pilot data.

## Status

The instrumentation, feedback UI, lead pipeline, and aggregate queries are implemented. The pilot
itself has **not** run; the target numbers above remain unverified.
