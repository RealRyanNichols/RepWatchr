<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LeadRep Agent Instructions - RepWatchr

This repo is for RepWatchr and LeadRep verification intelligence only. Do not route this workspace into court, January 6, divorce, legal-service, or pro se workflows for this orchestration lane.

## Mission

RepWatchr turns public-source signals, proof packets, official records, vote/funding data, and verification gaps into lead intelligence, verified data packages, predictive analytics, web conversion improvements, and recurring revenue. The product should separate claims from proof, keep weak signals marked as unverified, and hand useful verification work to the right agent or human reviewer.

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
