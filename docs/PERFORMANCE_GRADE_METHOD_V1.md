# RepWatchr Performance Grade Method v1

- Status: proposed implementation contract
- Methodology version: `performance-grade-v1`
- Community methodology version: `community-sentiment-v1`

## Purpose and separation of outputs

The RepWatchr performance grade summarizes documented execution of public duties. It does not grade whether RepWatchr agrees with an official's ideology, party, or policy choices.

Profiles must keep these outputs separate:

1. **Verified performance grade** — a 0–100 score and, when the publication gate is met, an A–F grade.
2. **Vote record and optional issue alignment** — the sourced vote itself and, if a member chooses, a personal comparison against that member's preferences. Policy direction never changes the performance grade.
3. **Verified participant sentiment** — a privacy-thresholded, self-selected member aggregate. It is not a poll, endorsement, or performance input.
4. **Evidence confidence and profile completeness** — descriptions of data quality and missing records, never measures of performance.

Non-incumbent candidates without a record in the relevant public office do not receive an officeholder performance grade. Their profiles may show sourced positions, promises, disclosures, finance records, issue alignment, and participant sentiment.

## Legislator scorecard

| Category | Weight | Neutral question |
| --- | ---: | --- |
| Official voting participation and accountability | 20% | Did the official take a documented, accountable position when eligible, without scoring yea or nay as ideologically correct? |
| Legislative effectiveness | 25% | Did the official convert institutional opportunities into substantive, documented outcomes? |
| Ethics and integrity | 25% | Did the official comply with applicable filings, disclosures, conflict rules, and final authoritative findings? |
| Constituent service and transparency | 20% | Is the office objectively accessible, responsive, and compliant with applicable transparency duties? |
| Attendance and duty fulfillment | 10% | Did the official attend eligible sessions, meetings, and assigned duties? |
| Community sentiment | 0% | This is displayed separately and never changes the performance grade. |

Executives use the same weights but replace official votes with documented official decisions or orders and replace legislative effectiveness with operational effectiveness. Local boards use recorded board decisions and adopted actions. A role-specific template must be published before it is used; an individual profile cannot dynamically redefine its categories.

### Official voting participation and accountability — 20%

Policy direction earns no points. A yea, nay, present vote, or procedurally valid abstention is not labeled good or bad.

- 75%: qualified participation in substantive recorded decisions.
- 25%: public explanation coverage for a predeclared set of major decisions, such as final passage, budgets, tax or bond decisions, veto overrides, removals, and constitutional measures.

Documented required recusals are removed from the denominator. Valid abstentions count as participation. To avoid double counting, votes missed during a meeting already scored as an attendance absence do not also reduce this category.

### Legislative effectiveness — 25%

- 35%: substantive measures advanced.
- 30%: measures or amendments adopted or enacted.
- 20%: committee and oversight outputs.
- 15%: documented implementation or follow-through.

Results are normalized by opportunity against officials in the same institution, session, role band, tenure band, leadership or committee responsibilities, and majority/minority opportunity. Party identity, ideology, bipartisanship, endorsements, fundraising, and press volume are not scoring features.

Use outcomes rather than raw bill counts. Ceremonial measures, duplicate measures, nominal cosponsorship, and press releases receive no credit or an explicitly published low weight. If a comparable cohort is too small for a stable distribution, use a prepublished absolute rubric instead of a percentile.

### Ethics and integrity — 25%

The category begins at 100 only after the applicable source checklist has enough coverage. Deductions use the final disposition of a single deduplicated event:

| Final finding | Category deduction range |
| --- | ---: |
| Corrected administrative filing issue | 2–5 |
| Formal warning or reprimand | 8–15 |
| Civil penalty or substantiated conflict violation | 15–30 |
| Intentional misuse of office or serious adjudicated misconduct | 30–50 |
| Office-related conviction, removal, or disqualification | 60–100 |

Only final court orders, independent authorized ethics findings, audits, or equivalent authoritative dispositions affect the score. Allegations, open investigations, campaign claims, anonymous tips, and unadjudicated reporting have zero score effect and may appear only as clearly labeled unresolved records.

A chamber censure does not automatically deduct points when it is solely a political vote. Its underlying conduct must independently satisfy the same evidence rubric. Overturned findings are removed through a new superseding snapshot. Minor corrected administrative findings may decay under a published rule; serious unresolved findings do not rapidly decay.

### Constituent service and transparency — 20%

- 35%: timely required agendas, minutes, disclosures, and public records.
- 25%: response performance under a standardized, identical inquiry or records-request protocol.
- 20%: objectively verifiable access, such as current public contact channels, office hours, and applicable accessibility or language access.
- 20%: audited service or casework outcome reporting where the role makes it available.

Anecdotal complaints, social followers, applause, post counts, media volume, and the political content of a response are excluded. Unavailable data lowers coverage; it is not silently declared inapplicable.

### Attendance and duty fulfillment — 10%

```text
attendance = 100 * (present + 0.5 * documented_partial_attendance)
                   / (eligible_events - approved_leave - required_official_duty_conflicts)
```

Only events during the official's active term and assignment are eligible. Approved leave and documented official-duty conflicts are excluded. Valid recusals and abstentions are not absences.

## Aggregation and missing data

For each scoreable category `i`:

```text
performance_score = round(sum(weight_i * eligible_i * category_score_i)
                          / sum(weight_i * eligible_i))
```

- `eligible_i` is 1 only when the category meets its published evidence threshold.
- Missing data is never entered as 0, 50, or a peer average.
- A genuinely inapplicable category uses a prepublished role template.
- Expected but uncollected data lowers coverage and cannot be relabeled as not applicable.
- Any renormalized effective weights must be displayed with the snapshot.

Confidence does not multiply the performance score. Doing so would turn missing data into a performance penalty.

For category `i`:

```text
category_confidence_i = coverage_i
                        * (0.50 * source_quality_i
                           + 0.25 * freshness_i
                           + 0.25 * reliability_i)
```

The snapshot stores the category breakdown, planned and effective weights, expected and observed denominators, exclusions, source manifest, weighted coverage, and confidence separately from the score.

## Publication gates

### Full score and letter grade

All of the following are required:

- At least 80% of planned category weight is scoreable.
- Weighted coverage is at least 70%.
- Overall confidence is at least 65%.
- At least four scoreable categories.
- Ethics and integrity is scoreable.
- The source window, methodology version, calculation time, reviewer, and source manifest are present.

### Provisional numeric score

A provisional score may be published without a letter when:

- At least 60% of planned weight is scoreable.
- Overall confidence is at least 45%.
- The row is explicitly labeled provisional.

### Insufficient verified data

Below the provisional gate, publish no numeric score and no letter. Display `Insufficient verified data` and the missing-data checklist. New officeholders remain `Building record` until at least 90 days and the role-specific minimum opportunity count.

### Letter mapping

The one canonical mapping is:

- A: 90–100
- B: 80–89.99
- C: 70–79.99
- D: 60–69.99
- F: below 60

Store calculation precision for audit, but display an integer score. Version 1 does not use plus/minus grades because the evidence does not justify that visual precision.

## Source hierarchy and recency

| Tier | Quality | Eligible use |
| --- | ---: | --- |
| 1 | 1.0 | Official roll calls, journals, filings, audits, final ethics orders, and court records. |
| 2 | 0.9 | Official transcripts, meeting video, agency datasets, and direct official statements. |
| 3 | 0.7 | Named independent reporting tied to primary records or independently corroborated. It cannot alone create an ethics deduction. |
| 4 | 0.4 | Campaign, advocacy, and social material. It may prove the speaker made a statement, not that an accusation is true. |
| Unverified | 0 | Research lead only; never score-moving. |

Every score-moving event needs a stable event ID, canonical source or snapshot, source date, access date, jurisdiction, record type, reviewer, review status, candidate response status, and supersession history.

Ordinary performance events use a two-year half-life unless the role template defines a shorter official term window. Participant sentiment uses a six-month half-life at aggregation time and excludes responses older than 12 months. Serious final integrity findings use a separate, slower rule and remain fully weighted while unresolved. Recency changes the relevance of verified evidence; it does not upgrade a weak source.

## Verified participant sentiment

Participant sentiment is a separate display with zero performance weight. The public label is:

> RepWatchr verified participant sentiment — not an election or scientific poll.

The service-side aggregation process must use only votes that remain eligible under the verification epoch, geography, moderation, and anomaly rules. One current response per verified member, target, scope, and methodology version is allowed. In-district results are the primary segment; other scopes are labeled separately.

The existing grade inputs map to `A=100`, `B=80`, `C=60`, `D=40`, and `F=0`. For eligible sample size `n`, raw mean `x`, neutral prior mean 50, and prior weight `k=50`:

```text
bayesian_sentiment = (n * x + 50 * 50) / (n + 50)
```

No public aggregate is available below `n=25`. Public rows show the sample size, grade distribution, raw mean, Bayesian score, scope, time window, and last response date. Subgroup snapshots use the same gate. Low sample size creates uncertainty; it must not shrink toward zero and appear as disapproval.

## Anti-gaming and neutrality controls

- Publish and version weights, thresholds, exclusions, source rules, and role templates.
- Freeze methodology rule changes during the 90 days before an election; verified records may continue to update under the frozen rules.
- Deduplicate one event across sources and categories.
- Cap the total impact of an ordinary single event; final severe integrity dispositions use the published severity override.
- Normalize production by opportunity and limit raw-count outliers.
- Use blind evidence coding where feasible and two reviewers for high-impact events.
- Exclude party, ideology, endorsements, fundraising, popularity, follower counts, news volume, and community sentiment from performance features.
- Apply identical source checklists and time windows to comparable officials.
- Audit score and coverage residuals across party, geography, incumbency, role, and reviewer without forcing equal outcomes.
- Never rank incomparable offices or sessions as if they share the same opportunity set.

## Notice, response, correction, and appeal

1. Intake and source verification.
2. Evidence classification and preliminary impact calculation.
3. Notice to the official for a new integrity event or projected overall change of at least two points.
4. Ten-business-day response window before ordinary publication.
5. Independent second review for high-impact records.
6. Publication with evidence, formula inputs, and any response.
7. Appeal to a reviewer who did not make the original decision.
8. Target appeal decision within 30 days.
9. Correction by a new snapshot that supersedes, rather than overwrites, the prior result.

Evidence states include `pending`, `verified`, `contested`, `final`, `overturned`, and `superseded`. Pending or contested allegations do not cause deductions. Clear factual errors can be withdrawn immediately while review continues. Appeals are free, reviewer conflicts are disclosed, and the public history retains prior methodology versions and corrections.

## Public display contract

A full-grade header should show:

```text
84 / 100 — B
High confidence · 82% coverage · through 2026-06-30 · performance-grade-v1
Measures documented job performance, not ideology or whether RepWatchr agrees with a vote.
```

Each category exposes its fixed weight, effective contribution, score or missing state, confidence, coverage, numerator and denominator, exclusions, time window, source list, and change explanation. The vote record, optional personal alignment, and verified participant sentiment use separate cards or tabs. The UI must distinguish missing data, insufficient opportunity, and true non-applicability.

Any chatbot answer about a grade must retrieve the published snapshot, methodology version, calculation date, confidence, and cited evidence. It must not recalculate from incomplete context or treat unresolved claims as findings.

## Adjacent comment-ranking integrity control

Comment ranking is not a performance-grade input, but false authority badges can distort community context. The accompanying migration therefore treats `author_type`, `contains_source`, and `rank_score` as server-derived fields:

- `claimed_official` requires both a trusted `user_roles` assignment and an approved profile claim matching the commented-on official.
- `journalist` requires both a trusted journalist role and an approved journalist profile claim.
- `verified_resident` requires a currently verified profile and verification epoch.
- All other signed-in authors fail closed to `signed_in`; the client cannot promote itself.
- `contains_source` is true only for a bounded, syntactically valid HTTP(S) `source_url`.
- `rank_score` is recalculated after the trusted author and source states are derived.

The legacy comments schema is not yet part of the timestamped canonical migration chain. The migration installs and backfills the trigger only when `public.comments` and all required ranking columns already exist; otherwise it emits a notice and makes no guessed schema changes. When comments are canonicalized later, that migration must include this trigger or this migration's trigger-install block must be rerun.
