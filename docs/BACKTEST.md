# Probability backtest

Generated 2026-11-01 · model `logistic-1.1.0`

> Proxy fixture only — **not official cutoff data**. Re-run `pnpm backtest --db` against production rows before quoting these metrics.

## Setup

- Trend rows: 272
- Candidate observations: 1761
- Source: synthetic fixture — Proxy fixture for pipeline verification. Not official cutoff data. Rerun `pnpm backtest --db` against production rows before quoting metrics.
- Target: did the candidate percentile clear the Round 3 closing cutoff?
- Prediction: `roundChances(percentile, row).round3`

## Metrics

| Metric | Value |
|---|---|
| Brier score | 0.0694 |
| Log loss | 0.2657 |
| Accuracy @ 0.5 | 1 |
| Observed clearance rate | 0.6911 |

Lower Brier and log loss are better. Accuracy is reported for completeness; calibration is the useful signal.

## Calibration

| Predicted bucket | n | Mean predicted | Observed rate |
|---|---:|---:|---:|
| 10–20% | 272 | 0.159 | 0.000 |
| 30–40% | 272 | 0.303 | 0.000 |
| 50–60% | 272 | 0.500 | 1.000 |
| 70–80% | 408 | 0.777 | 1.000 |
| 90–100% | 537 | 0.944 | 1.000 |

## Limitations

- A trend row carries the three closing cutoffs, so the Round 3 cutoff is known when scoring. This
  measures whether the logistic curve turns the cutoff into a coherent probability, not whether the
  cutoff itself can be forecast from earlier information.
- The default source is a committed synthetic fixture used to verify the pipeline. Rerun against the
  production database for a real calibration report.
- Candidate percentiles are sampled around the cutoffs; they are not a population of real applicants.

## Reproduce

```bash
pnpm backtest        # fixture
pnpm backtest --db   # production rows
```
