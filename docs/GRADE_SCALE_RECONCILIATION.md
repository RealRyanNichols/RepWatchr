# Grade Scale Reconciliation

- Status: open product decision, not yet implemented
- Scope: the three A-F letter-grade scales currently live in the codebase
- Action taken so far: each function has been commented in place naming what it is for and cross-referencing the other two. No scale has been changed.

## The conflict

RepWatchr renders letter grades from three different functions with three different cutoffs. A profile page can show the same underlying number as two different letters depending on which component drew it.

| | `calculateLetterGrade` | `scoreToLetterGrade` | `averageToGrade` |
| --- | --- | --- | --- |
| File | `src/lib/scoring.ts` | `src/lib/performance-grade.ts` | `src/components/scorecards/ProfileScorecardVote.tsx` |
| Measures | Editorial source-backed vote-record score | Performance methodology score (duties executed) | Mean of verified members' A-F votes |
| A+ | >= 98 | not used | not used |
| A | >= 95 | >= 90 | >= 90 |
| A- | >= 90 | not used | not used |
| B | >= 85 | >= 80 | >= 70 |
| C | >= 80 | >= 70 | >= 50 |
| D | >= 70 | >= 60 | >= 30 |
| F | else | else | else |

### What a score of 80 renders as

- Editorial scorecard: **C**
- Performance grade: **B**
- Community vote average: **B**

A score of 72 renders as **D**, **C**, and **B** respectively. That is a three-letter spread on the same number, on pages that sit next to each other in the same nav.

## Why they are not simply duplicates

This is the part that matters, and it is why "just pick one" is the wrong first instinct.

1. **`calculateLetterGrade` is an editorial curve.** Its stated intent is that an official should not get flattering visual treatment for a barely passing record. The strictness is the product opinion. Loosening it to the academic scale would silently upgrade every published vote-record badge on the site.

2. **`scoreToLetterGrade` is a published contract.** `docs/PERFORMANCE_GRADE_METHOD_V1.md` documents the Performance Grade Method to the reader, and the method is explicitly framed as neutral measurement of duty execution rather than ideological agreement. Its cutoffs are part of a methodology RepWatchr has committed to in public. Changing them changes a published method version and should bump `PERFORMANCE_GRADE_METHOD_VERSION`.

3. **`averageToGrade` is not a curve at all.** Members vote on discrete anchors defined in the same file: `A=100, B=80, C=60, D=40, F=0`. The 90/70/50/30 cutoffs are the midpoints between those anchors. They exist so the displayed letter round-trips the survey: if the average member said B (80), the badge must read B. Applying the editorial curve here would show "C" to a population that voted B, which would misreport the community, not grade it harder.

So the three scales are measuring an editorial judgment, a methodology output, and a survey result. Only the first two are grades in the same sense.

## Recommendation

**Do not unify all three. Unify two, and rename the third.**

1. **Keep `averageToGrade` exactly as-is, but stop calling it a grade.** It is an aggregation of member responses. Rename the display concept to something like "community rating" or "member consensus" in both the UI and the function name, and keep the midpoint cutoffs. This removes most of the perceived conflict at zero methodological cost, because the disagreement here is a category error rather than an inconsistency.

2. **`calculateLetterGrade` should win between the remaining two.** Reasons:
   - It is the scale the reader meets first and most often (`/scorecards`, `/scorecards/[category]`, official profile badges).
   - Its strictness is a deliberate, stated editorial position that matches the site's accountability premise. The academic scale is a default, not a decision.
   - `calculateLetterGrade` also carries the finer-grained bands (A+, A-) that the performance grade's `"A" | "B" | "C" | "D" | "F"` union cannot express, so migrating toward it is additive rather than lossy.

3. **Migrate `scoreToLetterGrade` to the editorial cutoffs as a versioned methodology change, not a refactor.** Concretely: widen the return type to include `A+`/`A-`, adopt the `calculateLetterGrade` thresholds, bump `PERFORMANCE_GRADE_METHOD_VERSION` to `2.0`, and update `docs/PERFORMANCE_GRADE_METHOD_V1.md` (or supersede it with a v2 doc). Every previously published performance grade must be re-rendered, and any stored letter grades regenerated from their numeric scores. Officials will visibly move down a letter; that is the point of the change and it needs an editorial note, not a silent deploy.

### If the decision is instead to keep them separate

That is defensible. In that case the minimum required is reader-facing disambiguation: the two grades must never appear as bare letters in the same view without a label naming which scale produced them, and the methodology page should state both cutoff tables side by side. Silent divergence is the only outcome that is clearly wrong.

## Open questions for the product owner

- Does the published Performance Grade Method v1 have external commitments (partners, press, prior share cards) that make a cutoff change costly?
- Are any letter grades persisted anywhere, or are they all derived at render time? Persisted letters would need a backfill.
- Should `getScoreBand` / `getScoreDescription` in `src/lib/scoring.ts` (bands at 95/90/80/70/60) be folded into the same decision? They are a fourth cutoff set, used for color and prose rather than letters, and they already disagree with `calculateLetterGrade`.
