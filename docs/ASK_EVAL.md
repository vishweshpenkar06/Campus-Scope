# Ask slot evaluation

Generated 2026-11-26 · rules fallback (no API key)

> The committed eval scores the deterministic rules parser. Provider-backed
> extraction uses the same slot schema and is expected to meet or beat these
> numbers; run the same eval with `GEMINI_API_KEY` set to measure it.

## Scorecard

| Metric | Value | Target |
|---|---:|---:|
| Slot accuracy | 1 | ≥ 0.90 |
| Exact query match | 1 | — |
| Expected slots | 515 | — |
| Correct slots | 515 | — |
| Extra (unexpected) slots | 2 | — |
| Citation validity | 1 | ≥ 0.95 |
| Unknown-intent refusal rate | 1 | — |
| Hallucinated cutoffs | 0 | 0 |

Citation validity is measured with `citationFor` on 40 fixture rows. The rules
parser never emits a percentage, cutoff, or citation, so it cannot hallucinate a
cutoff; the 0 above is structural, not a model claim.

## By tag

| Tag | Cases | Scored slots | Accuracy |
|---|---:|---:|---:|
| predict | 80 | 438 | 1 |
| deadline | 10 | 15 | 1 |
| fees | 8 | 17 | 1 |
| eligibility | 8 | 16 | 1 |
| compare | 8 | 23 | 1 |
| unknown | 6 | 6 | 1 |
| jee | 20 | 107 | 1 |

## Failures

None.

## Reproduce

```bash
pnpm eval:ask
```
