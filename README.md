# RepWatchr

RepWatchr is a public-accountability research product for finding public officials and candidates, inspecting source-backed records, comparing documented positions and votes, and submitting missing public evidence. The product is intended to make public records easier to review without turning unverified claims into published facts.

> **Important:** RepWatchr is not an election authority, candidate filing system, endorsement service, or scientific polling organization. Candidate and ballot status must be confirmed with the relevant election authority. Community votes, grades, and approval figures reflect participating RepWatchr users; they are not representative polls, election results, forecasts, or evidence of public consensus.

## Current state

This repository contains a broad Next.js application, static civic datasets, Supabase schema scripts, and several feature-gated or partially implemented systems. An audited route or data file is not proof that the corresponding production feature, database object, integration, or dataset is complete.

Before describing a capability as live, confirm all four layers: the code on `main`, the Vercel production deployment, the required Supabase migrations and policies, and the production feature flags. In particular:

- `source_seeded` means that source links were collected; it does not mean the profile or every claim was editorially verified.
- A profile completion percentage does not mean every vote, funding record, or controversy was reviewed.
- Raw roll-call imports, staff-reviewed issue mappings, editorial scores, and community ratings are different signals and must remain visibly separate.
- AI-assisted, member, voting, payments, email, public API, and other gated systems may be disabled or may require unapplied infrastructure.

The product direction, current gaps, and acceptance criteria are maintained in [`docs/repwatchr-product-blueprint.md`](docs/repwatchr-product-blueprint.md).

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Row Level Security, and server-side helpers
- Vercel hosting, Analytics, Speed Insights, and scheduled routes
- Fuse.js search and Recharts visualizations

Public profile data currently includes repository-managed JSON alongside Supabase-backed member, moderation, voting, and operational data. Treat neither store as authoritative until its source and review status are explicit.

## Local development

Requirements: a current Node.js release compatible with Next.js 16, npm, and access to a non-production Supabase project when testing database-backed flows.

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use [`.env.local.example`](.env.local.example) for the web application and [`.env.example`](.env.example) for LeadRep/orchestrator configuration. The complete variable and feature-flag reference is in [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md).

Never commit credentials. Browser-safe values are deliberately prefixed with `NEXT_PUBLIC_`; service-role keys, provider credentials, webhook secrets, cron secrets, and approval secrets must remain server-only. Keep optional integrations and publishing features disabled until their infrastructure and approval requirements have been verified.

## Core commands

```bash
npm run dev                 # local development server
npm run lint                # ESLint
npm run build               # production build and type checking
npm run qa:static           # repository-wide static QA
npm run smoke:integrity     # civic-data and evidence integrity checks
npm run qa:routes           # smoke a running local/preview deployment
```

Set `REPWATCHR_SMOKE_BASE_URL` when checking a preview or deployed site:

```bash
REPWATCHR_SMOKE_BASE_URL=https://preview.example npm run qa:routes
```

Feature-specific smoke commands are listed in `package.json`; the required release set is maintained in [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md).

## Evidence and publication rules

Code review is not editorial review. Any change that could publish a factual claim about a person, office, organization, vote, filing, investigation, funding source, or election must follow these rules:

1. Prefer the direct official record. When a primary record is unavailable, identify the named publication or institution and retain a direct, working source URL.
2. Record source and review metadata with the claim. A generic agency homepage, search-result page, or unsourced summary is not sufficient support for a specific allegation.
3. Keep new or uncertain material non-public with an explicit review state. `needs_source_review`, imported, generated, or AI-drafted content must not be promoted automatically.
4. Require human editorial approval for scores, issue classifications, red flags, legal or ethical allegations, funding interpretations, candidate status, and AI-assisted copy.
5. Preserve the distinction between raw records and interpretation. Never present a community rating, algorithmic score, or AI summary as an official fact or scientific poll.
6. Protect private and restricted information. Review submissions and public-record responses for personal addresses, minors, medical information, sealed records, and other sensitive material before publication.
7. Make corrections traceable. Update the underlying source record and review metadata rather than silently overriding evidence in presentation code.

See [`docs/AI_LANGUAGE_GUARDRAILS.md`](docs/AI_LANGUAGE_GUARDRAILS.md), [`docs/DOCUMENT_REVIEW_POLICY.md`](docs/DOCUMENT_REVIEW_POLICY.md), and [`docs/MONEY_TRAIL_LANGUAGE_RULES.md`](docs/MONEY_TRAIL_LANGUAGE_RULES.md) for topic-specific controls.

## Database migrations and deployment

Supabase SQL in the repository is not proof that a migration has been applied. Use this order for every database-backed release:

1. Reconcile the feature's code with an ordered, reviewed migration. Include tables, views, functions, indexes, storage buckets, Row Level Security policies, backfills, and rollback or forward-fix notes.
2. Apply and test the migration in a non-production Supabase environment. Verify least-privilege access using anonymous, member, moderator/admin, and service-role paths as applicable.
3. Run the integrity, static QA, lint, build, and relevant feature smoke checks.
4. Deploy the matching commit to a Vercel preview and run route smoke tests against that preview.
5. Obtain explicit human approval for the evidence changes, production migration, feature-flag changes, and production promotion. A passing test or merged pull request is not production approval.
6. For an additive, backward-compatible release, apply the approved production migration before promoting the dependent application build. Use an expand/migrate/contract sequence; schedule destructive cleanup as a separate approved release.
7. Promote the exact reviewed commit, verify production routes and database health, and keep sensitive flags off until the post-deploy checks pass.

Do not run ad hoc SQL against production, enable publishing or automation as a side effect of deployment, or assume Vercel and Supabase are synchronized. Follow [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) and [`docs/API_SECURITY_MODEL.md`](docs/API_SECURITY_MODEL.md).

## Repository map

- `src/app` — public pages, authenticated areas, and route handlers
- `src/components` — product UI and feature surfaces
- `src/data` — repository-managed official, vote, score, funding, and supporting datasets
- `src/lib` — data access, search, scoring, integrations, and policy logic
- `scripts` — imports, QA, reports, and smoke checks
- `supabase*.sql` and `supabase/migrations` — database definitions that require environment verification
- `docs` — product, safety, data, operations, and release documentation

## Key documentation

- [`docs/repwatchr-product-blueprint.md`](docs/repwatchr-product-blueprint.md) — product direction, audited baseline, risks, and phased build plan
- [`docs/REPWatchr_Build_Map.md`](docs/REPWatchr_Build_Map.md) — route, data, and system inventory; validate dated findings against current code
- [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) — release checks and production gates
- [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) — environment-variable classification and feature flags
- [`docs/ELECTION_RACE_HUBS.md`](docs/ELECTION_RACE_HUBS.md) — election and candidate data model
- [`docs/CANDIDATE_COMPARISON_SYSTEM.md`](docs/CANDIDATE_COMPARISON_SYSTEM.md) — comparison safety and product behavior
- [`docs/QA_MONITORING_SYSTEM.md`](docs/QA_MONITORING_SYSTEM.md) — quality monitoring and error handling
- [`docs/PUBLIC_DATA_API_PLAN.md`](docs/PUBLIC_DATA_API_PLAN.md) — public API scope and launch controls
