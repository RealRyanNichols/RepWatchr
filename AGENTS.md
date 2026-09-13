<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LeadRep Agent Instructions - RepWatchr

This repo is for RepWatchr and LeadRep verification intelligence only. Do not route this workspace into court, January 6, divorce, legal-service, or pro se workflows for this orchestration lane.

## Mission

RepWatchr turns public-source signals, proof packets, official records, vote/funding data, and verification gaps into lead intelligence, verified data packages, predictive analytics, web conversion improvements, and recurring revenue. The product should separate claims from proof, keep weak signals marked as unverified, and hand useful verification work to the right agent or human reviewer.

## Coverage Beat

- The politics of this site are anchored to two districts: **HD-7** (Texas House District 7) for state coverage and **TX-01** (Texas's 1st congressional district) for federal coverage.
- Coverage order is HD-7 / TX-01 first, then the wider East Texas launch territory, then Texas, then Washington. Statewide and national records run when they reach these districts or are big enough that readers in these counties need them regardless.
- `src/lib/home-districts.ts` is the single source of truth for the beat: counties, officeholders, boundary provenance, and coverage tiers. Do not hard-code district or county lists in pages, wire lanes, or ranking logic; read them from that module.
- TX-01's county list is carried as `needs_authentication` pending the Texas Legislative Council county-district report for PlanC2333. Use it to aim coverage; do not publish it as an established boundary finding.

## Buildout Footprint

- The current buildout target is every elected seat in every county, city and town inside HD-7 and TX-01, and nothing outside it for now.
- `src/lib/district-footprint.ts` holds that footprint: the 13 counties, the confirmed municipalities, and the expected elected-office slate for each kind of jurisdiction. `/home-district/roster` publishes the resulting seat ledger, including what is missing.
- The municipality list is a working set flagged `needs_authentication`, not a certified census of incorporated places. A town absent from it is a gap to fill, never a place ruled out of the footprint.
- `districtFocusOnly` (`NEXT_PUBLIC_DISTRICT_FOCUS_ONLY`) scopes the public directory to the footprint. It is reversible and never makes an out-of-district record unreachable: a name search or an explicit state, county, city or level filter still returns it. Do not delete out-of-district profiles to achieve focus.

## Repo Rules

- Work on the `main` branch unless Ryan explicitly instructs otherwise.
- Pull latest before making changes when the task involves GitHub state.
- Keep proof, verification, source labels, and review status visible.
- Do not expose private source submissions, service keys, webhook secrets, or unreleased packages in client-side code.
- Do not auto-publish, auto-text, auto-email, auto-DM, or spend API credits without approval.
- Run `npm run build` before final handoff whenever code changes.

## LeadRep Orchestration

- GitHub issues and comments are the handoff log between Codex, Grok/xAI, GitHub Actions, Supabase, and Vercel.
- Supabase is the agent memory and task bus. Use service-role access only from server-side scripts, CI, or trusted admin runtimes.
- Vercel is the runtime and deploy layer. Production deploys stay approval-gated.
- Default orchestration mode is dry-run. Grok/xAI API calls run only when `LEADREP_GROK_MODE=api`, `XAI_API_KEY` exists, and approval is cleared.
- Any result that would publish, contact someone, change pricing, create a paid campaign, or promote an unverified finding must stop in `approval_queue`.
