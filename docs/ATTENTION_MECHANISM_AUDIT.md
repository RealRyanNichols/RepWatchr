# RepWatchr Attention Mechanism Audit

Generated: 2026-07-01T04:40:19.512365+00:00

RepWatchr is treated as a civic operating system: every public page needs a natural next click so users do not hit a dead end.

## Measurement

- Target average pages per session: 8+
- Page-depth event: `pages_per_session_progress`
- Attention click event: `attention_mechanism_click`
- Note: PageViewTracker stores unique public routes visited in browser sessionStorage and emits session_page_depth through Vercel Analytics.

## Summary

- Total page routes audited: 65
- Public page routes: 51
- Private/auth/admin page routes: 14
- Public routes covered: 51
- Public routes uncovered: 0

## Page Coverage

| Route | Scope | Mechanisms | Status |
| --- | --- | --- | --- |
| `/about` | public | Route links, CivicLoopPanel | covered |
| `/admin/claims` | private/auth | workflow navigation | covered |
| `/admin/content-review` | private/auth | workflow navigation | covered |
| `/admin/control-center` | private/auth | workflow navigation | covered |
| `/admin/superadmin` | private/auth | workflow navigation | covered |
| `/admin/superadmin/preview` | private/auth | workflow navigation | covered |
| `/attorneys/:slug` | public | Route links, CivicLoopPanel | covered |
| `/attorneys` | public | Route links, CivicLoopPanel | covered |
| `/auth/login` | private/auth | Route links | covered |
| `/auth/signup` | private/auth | Route links | covered |
| `/auth/verify` | private/auth | Route links | covered |
| `/authority-watch` | public | Route links, CivicLoopPanel | covered |
| `/authors` | public | Route links, CivicLoopPanel | covered |
| `/blog` | public | Route links, CivicLoopPanel | covered |
| `/buildout` | public | Missing Source, Route links, CivicLoopPanel | covered |
| `/create-account` | private/auth | workflow navigation | covered |
| `/daily-wire` | public | Missing Source, Route links, Submit Missing Source, CivicLoopPanel | covered |
| `/dashboard/claims` | private/auth | Route links | covered |
| `/dashboard/official-profile/:claimId` | private/auth | workflow navigation | covered |
| `/dashboard` | private/auth | Route links | covered |
| `/dashboard/settings` | private/auth | Route links | covered |
| `/data-reports` | public | Route links, CivicLoopPanel | covered |
| `/east-texas-predator-watch/:slug` | public | Route links, CivicLoopPanel | covered |
| `/east-texas-predator-watch` | public | Route links, CivicLoopPanel | covered |
| `/elections` | public | Missing Source, Route links, Share buttons, Submit Missing Source, CivicLoopPanel | covered |
| `/elections/texas/:raceSlug` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/elections/texas/contribute` | public | Route links, CivicLoopPanel | covered |
| `/elections/texas` | public | Route links, CivicLoopPanel | covered |
| `/faretta-ai` | public | CivicLoopPanel | covered |
| `/feed` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/feedback` | public | CivicLoopPanel | covered |
| `/funding/:officialId` | public | Route links, CivicLoopPanel | covered |
| `/funding` | public | Route links, CivicLoopPanel | covered |
| `/gideon` | public | CivicLoopPanel | covered |
| `/growth-engine` | public | Route links, CivicLoopPanel | covered |
| `/issues/:id` | public | Route links, CivicLoopPanel | covered |
| `/issues` | public | Route links, CivicLoopPanel | covered |
| `/login` | private/auth | workflow navigation | covered |
| `/media/:slug` | public | Route links, CivicLoopPanel | covered |
| `/media` | public | Route links, CivicLoopPanel | covered |
| `/methodology` | public | Route links, CivicLoopPanel | covered |
| `/news/:id` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/news` | public | Route links, CivicLoopPanel | covered |
| `/officials/:id` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/officials` | public | Route links, CivicLoopPanel | covered |
| `/` | public | Missing Source, Route links, CivicLoopPanel | covered |
| `/privacy` | public | Route links, CivicLoopPanel | covered |
| `/profiles/claim` | public | CivicLoopPanel | covered |
| `/public-safety/:slug` | public | Route links, CivicLoopPanel | covered |
| `/public-safety` | public | Route links, CivicLoopPanel | covered |
| `/red-flags` | public | Route links, CivicLoopPanel | covered |
| `/school-boards/:districtSlug/:candidateId` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/school-boards/:districtSlug` | public | Route links, CivicLoopPanel | covered |
| `/school-boards` | public | Route links, Share buttons, CivicLoopPanel | covered |
| `/scorecards/:category` | public | Route links, CivicLoopPanel | covered |
| `/scorecards` | public | Route links, CivicLoopPanel | covered |
| `/search` | public | CivicLoopPanel | covered |
| `/services/:slug` | public | Route links, CivicLoopPanel | covered |
| `/services` | public | Route links, CivicLoopPanel | covered |
| `/state-reps` | public | Route links, CivicLoopPanel | covered |
| `/submit-source` | public | CivicLoopPanel | covered |
| `/terms` | public | Route links, CivicLoopPanel | covered |
| `/uap` | public | Route links, CivicLoopPanel | covered |
| `/votes/:billId` | public | Route links, CivicLoopPanel | covered |
| `/votes` | public | Route links, CivicLoopPanel | covered |
