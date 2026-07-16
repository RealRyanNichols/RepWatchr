# RepWatchr Product and Technical Blueprint

Status: proposed implementation plan
Audit baseline: July 15, 2026

## Product direction

RepWatchr should be a neutral, source-first accountability product for candidates and public officials. Its core promise is simple: a public fact is linked to reviewable evidence and labeled with its review state, or RepWatchr says that the information is missing or under review.

RepWatchr is not an election authority, an official ballot, an endorsement engine, or an allegation generator. Community votes measure sentiment among verified RepWatchr members; they do not represent an election result or a scientific poll.

The primary user journeys are:

1. Find a candidate, official, office, or race and inspect the sourced record.
2. Compare candidates in the same race without mixing facts, editorial judgments, and popularity.
3. Ask the RepWatchr assistant a question and receive a cited answer or a clear refusal.
4. Follow local races and officials from a member dashboard.
5. Cast or revise a community vote after identity and jurisdiction verification.
6. Submit a source or correction and see its review status.

## Audited starting point

The existing Next.js application, Supabase project, and Vercel deployment provide a substantial base, but the following are not yet production-ready capabilities:

- Candidate and race content is primarily assembled from static application data; production does not have a complete canonical candidate catalog.
- Supabase contains official-profile snapshots, but they do not constitute a normalized candidate, candidacy, office-term, and election model.
- The unsafe eight-digit browser verification path has been removed and voting is default-off. The preview now separates confirmed account, verified person, verified resident, and registered-voter states; provider/postal/manual workflows still require non-production integration testing before launch.
- Voting tables and interfaces exist, but there is no meaningful vote activity and the current trust boundary does not adequately prevent self-asserted verification or location.
- The dashboard is largely a client-side experience with local-storage fallbacks rather than a complete server-backed member product.
- The Faretta integration is an external chat proxy, not a RepWatchr retrieval system with a reviewed knowledge base and per-claim citations.
- Record score, community sentiment, source confidence, profile completeness, and ideological or personalized matching are currently mixed in places. They need separate models and labels.
- Public vote and scorecard fixtures cannot be treated as verified: audit checks found bill identifiers, titles, and chambers that do not agree with primary sources. They must be quarantined until individually reviewed.
- Production schema history is incomplete relative to the SQL files in the repository. A reconciled baseline and repeatable migrations are required before feature expansion.

This blueprint describes the target state. It does not claim that the target tables, APIs, verification, or AI behavior already exist.

## Non-negotiable product rules

- Every public factual claim has one or more source records, a review state, a reviewer or ingestion provenance, and a last-checked time.
- Draft, imported, AI-extracted, stale, disputed, and rejected data never appears as verified fact.
- Candidate-controlled pages, government records, journalism, and user submissions are visibly distinguished.
- An ingestion job or language model may propose data but may not publish it.
- Corrections are first-class records. Published corrections preserve the audit trail instead of silently rewriting history.
- A generic profile link cannot prove a specific vote, funding claim, statement, or field.
- Missing evidence produces `Not enough verified information`, not a zero, an inferred fact, or a negative grade.
- Public scores are reproducible from published inputs and a versioned methodology.
- RepWatchr never combines record performance, community popularity, confidence, completeness, and personalized match into one master score.
- Private source submissions, identity evidence, sensitive preferences, service keys, and model credentials stay server-side.

## Canonical data model

Use Supabase Postgres as the canonical store. Static files may seed imports, but public pages should eventually read published database views or versioned API responses.

| Domain | Canonical records | Required relationship or invariant |
| --- | --- | --- |
| Identity | `people`, `organizations`, `aliases` | One person can be a candidate in several races and can hold several terms; identity merges require review. |
| Government | `jurisdictions`, `offices`, `office_terms` | Office is separate from the person occupying it; every term has start/end dates and a source. |
| Elections | `elections`, `races`, `candidacies` | A candidacy joins one person to one race. Ballot status, filing status, party, and result are sourced fields, not person attributes. |
| Evidence | `sources`, `source_snapshots`, `claims`, `claim_sources` | A claim becomes public only when its evidence and review state satisfy the publication policy. A snapshot stores retrieval time and content hash. |
| Record | `bills`, `record_events`, `positions`, `finance_filings`, `public_statements` | Every scored event maps to a primary source, person or term, date, jurisdiction, and methodology rule. |
| Publication | `profile_publications`, `publication_items`, `corrections` | Public profile output is an immutable/versioned projection of reviewed records. |
| Community | `member_verifications`, `community_vote_events`, `community_vote_current`, `community_aggregate_snapshots` | Vote identity and district are server-stamped. A change appends an event and updates the current projection. |
| Personalization | `member_follows`, `member_issue_preferences`, `saved_items`, `notification_preferences` | Member-owned data is private by default and protected by RLS. |
| Brain | `knowledge_documents`, `knowledge_chunks`, `brain_conversations`, `brain_messages`, `brain_citations`, `brain_feedback` | Public retrieval can use only published documents; citations resolve to public evidence. |
| Operations | `review_queue`, `audit_events`, `ingestion_runs`, `methodology_versions`, `feature_flags` | All privileged changes and automated runs are attributable and replayable. |

The repository's existing `races` and `race_candidates` design can be migrated rather than discarded. `race_candidates` should become, or map one-to-one to, canonical `candidacies` linked to `people`; candidate name and profile links should no longer be the identity model.

### Publication state machine

`draft/imported -> needs_review -> verified -> published`

Side states are `disputed`, `rejected`, `superseded`, and `archived`. Only `published` records appear in public APIs. A claim cannot become `verified` without at least one eligible source, and an AI-produced proposal always enters `needs_review`.

An eligible source record includes:

- canonical URL and source type;
- publisher/issuing authority;
- document or event date;
- retrieved time and content hash where capture is permitted;
- the exact field or claim it supports;
- reviewer, review time, and review notes;
- stale-after policy and correction status.

## Profile and race experience

Each candidate or official page should use the same identity and evidence system while showing role-specific sections.

Public profile sections:

- Identity, current role or candidacy, jurisdiction, and verified roster/filing source.
- Office history and candidacy history.
- Sourced legislative or governing record, where applicable.
- Campaign finance filings and clearly labeled summaries.
- Public statements with date, context, transcript/link, and source type.
- Record score by methodology and issue; never a score without sufficient coverage.
- Community sentiment with sample size and geographic eligibility note.
- Coverage/completeness panel listing what is present, missing, stale, or disputed.
- Source list, correction history, submit-source action, and last-reviewed time.

Race pages should be built from a sourced roster and normalized candidacies. A race stays `noindex` and `needs_review` until its election authority, office, date, candidate roster, and at least one roster/filing source have been reviewed. Withdrawn or disqualified candidates remain in history with their sourced status and effective date.

The admin workflow should support field-level review, side-by-side source inspection, merge detection, a publish preview, correction handling, and a complete audit history. Bulk imports must be idempotent and enter `needs_review` unless an explicitly approved source rule permits structured verification.

## Four separate result systems

### 1. Source-backed record score

Purpose: summarize a person's verified public record against a disclosed RepWatchr methodology.

- Inputs are published `record_events` and versioned `methodology_rules` only.
- Each rule defines jurisdiction, issue, eligible event types, desired/undesired position, event weight, and effective dates.
- Event scoring and weights are visible. The calculation is:

  `record score = sum(event score * event weight) / sum(event weight)`

- The result includes the methodology version, scored-event count, eligible-event coverage, time window, issue breakdown, and calculation timestamp.
- When the minimum event count or coverage threshold in that methodology is not met, display `Not enough verified record` rather than a numeric score.
- Absences, abstentions, procedural votes, sponsorship, rhetoric, funding, and public sentiment may not be treated as equivalent. Each needs an explicit rule or a separate display.
- Recalculation creates a new snapshot; it does not overwrite the prior methodology result.

### 2. Verified community sentiment

Purpose: report what eligible, verified RepWatchr members submitted.

- Each verified member has equal weight at launch. Do not infer demographic or partisan weighting.
- Approval is `100 * approve / (approve + disapprove)` and is shown with vote count and a 95% Wilson interval.
- Letter grades use fixed values `A=100, B=80, C=60, D=40, F=0`; show the full distribution and count beside the mean.
- Hide an aggregate below 10 eligible votes. Hide geographic slices below 20 eligible votes.
- Confidence is a label based on sample size and interval width; it is not multiplied into the score.
- Flagged or revoked votes are excluded from current aggregates but retained in the private audit ledger with a reason.
- Every public snapshot names its algorithm/methodology version and explicitly says `RepWatchr member sentiment — not an election or scientific poll`.

### 3. Evidence confidence and profile completeness

Purpose: describe data quality, never performance.

- Confidence measures source eligibility, number of independent sources, review status, recency, and unresolved disputes.
- Completeness measures explicitly required fields for that profile type. Each field must have its own supporting source; a generic source or unrelated record does not count.
- Show a checklist and missing fields in addition to a percentage.
- Do not blend confidence or completeness into either the record score or community sentiment.

### 4. Personalized issue match

Purpose: help a member compare their stated preferences with sourced candidate positions.

- Compute the match from the member's selected issues and published `positions`; unknown positions remain unknown and reduce coverage rather than match.
- Display `match` and `coverage` separately, with the compared issues and source links.
- Do not publish a user's preferences, use them in the public record score, or present a match as an endorsement.
- Keep preferences private under RLS and offer a local-only/no-storage mode before launch.

## Verified community voting

### Trust boundary

All vote creation and revision must go through a server route or security-definer RPC with strict input validation. The server derives `user_id`, verified jurisdiction, assurance level, eligibility, and methodology version. The browser may not submit or update trusted identity, verification, district, or moderation fields.

Replace the current driver's-license-style form with a provider-backed or human-reviewed verification workflow. Never store raw identification numbers or an unsalted hash of them. Store only the minimum attestation: provider/reference token, assurance level, verified jurisdiction, verified/expiry/revocation times, and reviewer or provider provenance. Keep self-reported location in separate fields from verified location.

### Eligibility and controls

- Confirmed account, verified email, accepted community rules, and non-revoked verification.
- Eligibility rule scoped to the target: constituent sentiment requires a matching verified jurisdiction; nationwide sentiment must be labeled separately.
- One current vote per `member + target + vote type + scope + methodology version`, enforced by a database unique constraint.
- A revision appends an immutable vote event and supersedes the current vote; it never deletes history.
- Rate limits by account and privacy-preserving network/device signals, CAPTCHA or step-up checks after risk triggers, and cool-downs for new accounts.
- Automated risk flags for bursts, shared attestation references, impossible location changes, repeated account creation, and coordinated identical rationales.
- Risk flags hold votes out of aggregates for review; moderators see evidence and must record a disposition.
- Verification expiry, revocation, member appeal, and correction workflows.
- Aggregate privacy thresholds and no public member-level vote export.

The voting launch must include an abuse runbook, moderator queue, aggregate rebuild job, signed/idempotent writes, and a reconciliation test proving that ledger events reproduce each published snapshot.

## The RepWatchr brain and chatbot

The brain is a retrieval and citation layer over reviewed RepWatchr evidence, not a general-purpose political oracle.

### Knowledge pipeline

1. Retrieve approved public documents through idempotent ingestion jobs.
2. Store source metadata, capture hash, retrieval time, and document status.
3. Extract candidate claims/chunks into a private review corpus. Treat document text as untrusted input and ignore instructions embedded in sources.
4. Require review before claims/documents enter the public corpus.
5. Chunk, embed, and index only the approved text plus stable source identifiers.
6. Re-index on correction, supersession, or expiry and preserve the prior audit version.

### Answer contract

`POST /api/brain/chat` should return a structured response containing:

- answer text;
- citations with source title, URL, date, supported claim, and source status;
- coverage or missing-information notes;
- answer status: `answered`, `partial`, `needs_source`, `ambiguous_identity`, `under_review`, or `refused`;
- profile/race identifiers, knowledge snapshot, and methodology version when a score is discussed.

Every factual sentence must map to at least one retrieved, published citation. The server validates the citation-to-document relationship before returning an answer. If validation fails, it removes the unsupported sentence or refuses the answer.

### Fail-closed behavior

The assistant responds with what is unknown and how to find or submit a source when:

- no eligible source supports the answer;
- identity, race, office, date, or jurisdiction is ambiguous;
- the only material is draft, disputed, stale, user-submitted, or under review;
- the user asks it to infer guilt, corruption, motive, protected traits, or an unsupported legal conclusion;
- the user asks for a score that cannot be reproduced from a published methodology;
- model, retrieval, citation validation, or safety checks fail.

The assistant may summarize published records and compare sourced fields. It may not fabricate a position from party affiliation, turn an allegation into fact, auto-publish, or silently fall back to uncited model knowledge. Conversation content and feedback are member-private; retention, export, and deletion controls are required. Model credentials and service-role access remain server-side.

## Member dashboard

The dashboard should become a server-backed member home with these modules:

- `My area`: verified jurisdiction, representatives, offices, and upcoming sourced races.
- `Following`: watched people, offices, races, and issues.
- `My votes`: current votes, revision history, eligibility scope, aggregate publication status, and edit action.
- `My match`: private issue preferences, per-race match plus coverage, and source links.
- `Alerts`: newly published records, corrections, filing changes, and followed-race updates.
- `Contributions`: submitted sources/corrections and review status.
- `Verification and privacy`: self-reported versus verified location, assurance/expiry state, active sessions, export, and deletion.

Anonymous users can browse published evidence. Members can follow and submit sources. Only eligible verified members can cast constituent votes. Reviewers can inspect assigned evidence but cannot grant themselves admin or verification privileges. Admin actions require explicit roles and are audited.

RLS must deny by default. Client code receives public data or the signed-in member's rows only. Admin/reviewer operations go through audited server endpoints; the Supabase service role is never exposed to the browser.

## API and job boundaries

Initial versioned contracts:

- `GET /api/v1/profiles/:slug` — published identity, roles/candidacies, evidence-backed sections, four result systems, and coverage.
- `GET /api/v1/races/:slug` — published election/race, roster, candidacies, sources, and comparison fields.
- `GET /api/v1/methodologies/:version` — human- and machine-readable rules.
- `POST /api/member/votes` and `PATCH /api/member/votes/:id` — verified, idempotent server writes.
- `GET /api/member/dashboard` — member-owned dashboard projection.
- `POST /api/brain/chat` — retrieved, cited, validated answer contract.
- `POST /api/sources` and `POST /api/corrections` — submissions entering `needs_review`.
- Admin-only review, publish, merge, and moderation endpoints with role checks and audit events.

Scheduled jobs ingest approved sources, mark stale data, rebuild search/embeddings, recalculate versioned snapshots, and reconcile aggregates. A successful no-op or approval-gated skip should be recorded as `skipped`, not an HTTP 500. Jobs must be idempotent, observable, and unable to publish without an approved rule or human action.

## Delivery roadmap and acceptance criteria

### Phase 0 — Integrity freeze and production foundation

Deliver:

- Quarantine unreviewed vote/scorecard fixtures and any unsupported public claims.
- Disable the current verification and community-vote write paths.
- Reconcile production schema with a checked-in baseline; add forward-only migrations, RLS tests, backups, and rollback notes.
- Separate self-reported and verified identity/location fields; revoke browser writes to trusted fields.
- Repair analytics persistence and treat expected cron skips as non-errors.
- Define feature flags for candidate catalog, voting, brain, and dashboard modules, all off by default.

Acceptance:

- No public scorecard or claim is published without an eligible, reviewed source.
- A browser client cannot set `verified`, trusted jurisdiction, another `user_id`, moderation state, or aggregate fields.
- Automated RLS tests cover anonymous, member, verified member, reviewer, admin, and service roles.
- A clean environment can reproduce the production schema from checked-in migrations.
- Build, route smoke tests, security checks, and rollback rehearsal pass before an approval-gated deployment.

### Phase 1 — Canonical people, profiles, races, and review desk

Deliver:

- Canonical identity, office/term, election/race/candidacy, source/claim, correction, and publication models.
- Import adapters for current static records that preserve provenance and default to `needs_review`.
- Admin review queue, duplicate/merge workflow, field-level evidence, publication preview, and audit log.
- Public profile/race API and pages reading published projections.

Acceptance:

- A person's identity is stored once and can connect to multiple terms and candidacies.
- Every displayed field can open its supporting source and review metadata.
- A candidate roster can be reproduced from its election/filing sources.
- Draft, disputed, rejected, and stale-beyond-policy records are excluded from public views.
- The first launch geography reaches a documented field-completeness target with a reviewed source for every counted field.

### Phase 2 — Secure membership, dashboard core, and voting beta

Deliver:

- Server-backed follows, submissions, verification state, vote history, and privacy controls.
- Approved identity/jurisdiction verification process with minimal retained evidence.
- Append-only vote ledger, current-vote projection, abuse queue, aggregate snapshots, and reconciliation job.
- Dashboard modules for area, follows, votes, contributions, and verification.

Acceptance:

- Verification cannot be self-asserted and raw identification values never enter RepWatchr storage or logs.
- Duplicate current votes are prevented at the database layer; revisions preserve history.
- Ineligible, expired, revoked, and held votes cannot enter public aggregates.
- Aggregate snapshots reproduce from the eligible ledger and honor privacy thresholds.
- The UI always labels results as RepWatchr member sentiment, with sample size, interval, scope, and algorithm version.
- Abuse, appeal, deletion, and incident-response drills pass with test accounts before beta expansion.

### Phase 3 — Sourced record scoring and personalized match

Deliver:

- Versioned methodology registry and reviewed record-event pipeline.
- Separate record score, evidence confidence/completeness, and private match calculations.
- Public calculation detail and downloadable source list.

Acceptance:

- Every score can be recalculated from published events and the named methodology version.
- Insufficient coverage yields `Not enough verified record`, never a misleading zero or grade.
- Changing a methodology creates a new snapshot without rewriting prior results.
- Community sentiment cannot change a record score; confidence cannot multiply or hide a result; member preferences remain private.

### Phase 4 — RepWatchr brain beta

Deliver:

- Reviewed knowledge pipeline, public/private corpus separation, retrieval, structured citations, safety validation, feedback, and audit logs.
- Profile/race assistant entry points and an admin citation-review tool.

Acceptance:

- Citation tests prove every factual sentence maps to an eligible published source.
- Red-team tests for prompt injection, unsupported allegations, ambiguous identities, stale sources, score questions, and provider failures fail closed.
- The assistant says `needs source` or refuses when support is absent; it never substitutes uncited general model knowledge.
- Corrections and source withdrawal are reflected in retrieval within the documented service level.
- No model response auto-publishes or changes canonical data.

### Phase 5 — Alerts, geographic expansion, and hardening

Deliver:

- Sourced alerts/digests, additional jurisdictions, ingestion monitoring, accessibility/performance work, and public methodology/change logs.
- Privacy review, penetration test, backup/restore exercise, election-period incident plan, and transparent system-status page.

Acceptance:

- Expansion requires a verified authority/filing source and a documented reviewer owner for each jurisdiction.
- Alert links resolve to the exact new or corrected record and respect member preferences.
- Backup restore, aggregate reconciliation, security review, load tests, accessibility checks, and incident exercises pass before wider promotion.

## Launch scorecard

No feature is considered launched until it has:

- a named product owner and reviewer owner;
- a versioned schema/API and migration/rollback path;
- explicit source, publication, correction, and retention rules;
- RLS/authorization, abuse, privacy, and audit tests;
- empty, loading, stale, disputed, insufficient-data, and provider-failure states;
- observable jobs and actionable error reporting;
- documented methodology and public labeling where an aggregate or score appears;
- an approval-gated production deployment and post-deploy smoke check.

The correct first public milestone is not “all profiles filled.” It is one launch geography where every visible field, score, candidate roster, community aggregate, and chatbot answer can be traced to a reviewed source or honestly states that evidence is missing.
