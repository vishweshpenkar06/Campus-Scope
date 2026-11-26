# Probability backtest

Generated 2026-11-26 · model `logistic-1.1.0`

> Run against production `CapRoundTrend` rows.

## Setup

- Trend rows: 61123
- Candidate observations: 381127
- Source: database (CapRoundTrend)
- Target: did the candidate percentile clear the Round 3 closing cutoff?
- Prediction: `roundChances(percentile, row).round3`

## Metrics

| Metric | Value |
|---|---|
| Brier score | 0.0817 |
| Log loss | 0.2813 |
| Accuracy @ 0.5 | 1 |
| Observed clearance rate | 0.3665 |

Lower Brier and log loss are better. Accuracy is reported for completeness; calibration is the useful signal.

## Year-over-year cutoff carry-forward

For each matching college/branch/category/exam, last year's Round 3 cutoff is used as the prediction for this year's Round 3 cutoff.

| Metric | Value |
|---|---:|
| Matched year pairs | 40114 |
| MAE | 11.888 percentile points |
| RMSE | 18.256 percentile points |
| Bias | -3.569 percentile points |
| Coverage | 0.807 |

## Calibration

| Predicted bucket | n | Mean predicted | Observed rate |
|---|---:|---:|---:|
| 0–10% | 57984 | 0.013 | 0.000 |
| 10–20% | 68885 | 0.158 | 0.000 |
| 20–30% | 7047 | 0.249 | 0.000 |
| 30–40% | 67881 | 0.308 | 0.000 |
| 40–50% | 39664 | 0.489 | 0.000 |
| 50–60% | 42872 | 0.514 | 1.000 |
| 60–70% | 17124 | 0.671 | 1.000 |
| 70–80% | 9952 | 0.749 | 1.000 |
| 80–90% | 10312 | 0.852 | 1.000 |
| 90–100% | 59406 | 0.985 | 1.000 |

## Limitations

- A trend row carries the three closing cutoffs, so the Round 3 cutoff is known when scoring. This
  measures whether the logistic curve turns the cutoff into a coherent probability, not whether the
  cutoff itself can be forecast from earlier information.
- The year-over-year carry-forward is a naive baseline: it predicts this year's Round 3 cutoff from
  last year's Round 3 cutoff. An MAE around 11 percentile points is a warning against marketing it
  as a forecast.
- This run used database (CapRoundTrend). Candidate percentiles are sampled around the cutoffs; they are not a
  population of real applicants.

## Reproduce

```bash
pnpm backtest        # fixture
pnpm backtest --db   # production rows
```
