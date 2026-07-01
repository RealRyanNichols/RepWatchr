# RepWatchr Next Prompts

Generated: 2026-07-01

Use these as ordered build prompts after the audit. They are intentionally scoped so RepWatchr can move from prototype to launch without breaking existing routes or making unsupported claims.

## Priority 1 - Stabilize Source, Safety, And Indexing

1. Build one Supabase-backed source submission queue and wire `/submit-source`, `/feedback`, profile correction buttons, and Texas election contributions into it.
2. Create `source_submissions`, `source_submission_events`, `source_submission_attachments`, `source_review_notes`, and `source_status_history` migrations with RLS.
3. Add a source submission thank-you page with submission ID, copyable packet, next action, share link, and account prompt.
4. Build an admin source review queue with status changes, internal notes, rejection reason, request-more-info, and attach-to-profile actions.
5. Create a reusable source label component for Confirmed public record, Source-backed claim, Public question, Needs source, Allegation, Opinion, Correction requested, and Under review.
6. Enforce red-flag requirements: source URL, date, jurisdiction, why it matters, status label, reviewer status, and correction link.
7. Add admin risky-language warnings for criminal accusations, threats, private addresses, minors, doxxing, harassment instructions, and claims beyond source support.
8. Add correction request workflow visibility on every profile, story, red flag, funding page, school-board page, and race page.
9. Replace all public setup-language leaks with user-safe fallback language and keep technical details admin-only.
10. Add route-level noindex metadata to auth, login, dashboard, admin, buildout, preview, and embed routes where missing.

## Priority 2 - SEO And Share Foundation

11. Build dynamic OG image routes for homepage, official profile, race, school board, article, funding, red flag, source packet, methodology, and services.
12. Create unique fallback OG templates that use page type, title, jurisdiction, source count, and RepWatchr branding.
13. Add distinct cover thumbnails to all Texas race pages and story cards.
14. Build a sitemap index route.
15. Split sitemaps into static, official profiles, school boards, races, stories, red flags/funding, images, and news.
16. Add news sitemap for recent story/news routes only.
17. Add image sitemap entries for pages with real images.
18. Add canonical URL helper and enforce canonical metadata across all indexable routes.
19. Add JSON-LD helpers for Organization, BreadcrumbList, Article/NewsArticle, ProfilePage, and Dataset.
20. Build an SEO report route or script that counts indexed URLs by type and flags missing metadata, canonical, OG image, duplicate slugs, and orphan pages.

## Priority 3 - Profile Completeness And Data Quality

21. Build a profile completeness dashboard that separates loaded shell, photo, official links, vote rows, mapped score, funding, red flags, timeline, and source count.
22. Add import health tables: `import_runs`, `import_errors`, `data_quality_issues`, `broken_links`, and `duplicate_candidates`.
23. Build admin health checks for FEC, Texas Ethics Commission, Open States, House/Senate roll calls, Texas Legislature roll calls, RSS/news wire, school boards, Supabase, Stripe, sitemap, and broken links.
24. Add duplicate profile detection and admin merge workflow.
25. Add missing slug and missing canonical checks.
26. Add broken source URL detection with status, last checked, failure reason, and mark-resolved action.
27. Add a public profile completeness label that does not imply full data when score/funding/votes are missing.
28. Add source credit tracking for every profile photo.
29. Add official profile source trail tabs: official links, vote links, funding links, meeting/video links, article links, correction history.
30. Add public questions to every profile with copyable safe wording and source-gap prompts.

## Priority 4 - Vote And Funding Depth

31. Build a vote import pipeline for current federal House/Senate roll calls with source URLs and roll-call IDs.
32. Build a Texas House and Texas Senate roll-call import pipeline for the last two years first, then extend by session.
33. Add issue tagging rules for votes without moving left/right charts until source/category mapping is reviewed.
34. Add a vote confidence model: unmapped, mapped low confidence, mapped high confidence, needs review.
35. Add vote score-impact fields with methodology references.
36. Add vote reaction capture for logged-in and verified users, segmented by constituency bucket.
37. Build FEC funding import for federal officials and candidates.
38. Build Texas Ethics Commission funding import for Texas state officials and candidates.
39. Add donor/PAC/vendor normalization with source URLs and cycle/date metadata.
40. Add funding summary cards that distinguish total raised, total spent, cash on hand, donor type, geography, and source date.

## Priority 5 - Search, Watchlists, And Retention

41. Upgrade `/officials` with server-side search, filters, pagination, and sorting.
42. Add filters for state, county, city, office level, office type, party, score range, red flags, funding data, voting data, missing sources, recently updated, watched, source count, and completeness.
43. Add sorting for relevance, most viewed, most watched, most sourced, highest score, lowest score, most red flags, recently updated, and missing source priority.
44. Replace simple search with predictive search showing officials, boards, counties, agencies, stories, issues, votes, funding, campaigns, news, recent searches, popular searches, trending searches, saved searches, and shareable searches.
45. Create unlimited watchlists for officials, cities, school boards, issues, bills, campaigns, donors, PACs, county commissioners, agencies, courts, and judges.
46. Add watchlist alert preferences for daily digest, weekly digest, breaking alerts, major vote alerts, new funding, new source, new article, new correction, new meeting, and new filing.
47. Add "what changed since last visit" to the dashboard.
48. Add "your next useful move" blocks to every major public page with route-specific CTAs.
49. Add "watch this record" CTA to profiles, votes, funding, stories, races, red flags, school boards, and source packets.
50. Add average pages per session admin reporting with a target of 8+.

## Priority 6 - Member Dashboard And Contributor System

51. Finish the member dashboard modules: Watchlist, Source Packet Builder, Public Records Request Drafts, Timeline Starter, Faretta AI notes, My Submissions, and Upgrade/Paid Services.
52. Build the Public Records Request Generator with state, agency, record type, date range, names, meeting/event, delivery method, requester contact, notes, and saved statuses.
53. Save generated public-record drafts with statuses: draft, sent, response received, partially fulfilled, denied, overdue, closed.
54. Add admin visibility only for public-record requests users choose to submit/share with RepWatchr.
55. Build contributor profiles with roles: Source Runner, Meeting Reporter, Vote Hunter, Funding Tracker, Researcher, Fact Checker, Editor, Community Builder.
56. Add XP, badges, public contributor pages, county rankings, state rankings, most useful contributor, most verified contributor, highest accuracy, and most accepted sources.
57. Add moderation and anti-abuse controls for contributor submissions and public profiles.
58. Add contributor source acceptance history to support reputation without paying for contributions.
59. Add dashboard digest preferences and consent controls.
60. Add account export/delete/privacy controls as required by policy.

## Priority 7 - Admin And Operations

61. Build secure `/admin` landing route that redirects non-admins server-side and links all admin modules.
62. Add audit log table and write before/after values for admin changes.
63. Add admin overview KPIs: signups, submissions, pending reviews, paid orders, active subscriptions, most-viewed profiles, most-shared profiles, broken source links.
64. Add Profile Manager search/edit for public fields, source links, missing data, red flags, and score status.
65. Add Revenue Desk for orders, subscriptions, service requests, customer emails, and fulfillment status.
66. Add Content Desk for story drafts, Daily Watch items, publish/unpublish, attach officials/sources, and generate share snippets.
67. Add Data Health desk for imports, cron status, duplicates, broken links, missing canonicals, and sitemap counts.
68. Add admin actions: rerun import, mark resolved, merge duplicate, quarantine bad item, attach source to profile.
69. Restrict health/integration endpoints so detailed setup status is not exposed publicly.
70. Add admin route smoke tests for role protection.

## Priority 8 - Daily Wire And Content Engine

71. Rebuild Daily Watch Wire filtering/scoring with jurisdiction match, geographic relevance, source domain, topic tags, official match, state/county/city match, duplicate score, quality score, source tier, publish date, and quarantine status.
72. Add wire statuses: accepted, needs_review, quarantined, duplicate, irrelevant, attached_to_profile, promoted_to_story.
73. Add source allowlist/denylist controls and query lanes.
74. Add public labels: Source-linked, Needs review, Local relevance confirmed, National relevance confirmed, Not yet attached to profile.
75. Build admin approve/reject/attach/promote actions for wire items.
76. Add story creation workflow that requires source links and safe claim labels.
77. Add article cover image requirements and fallback OG generation.
78. Add internal linking blocks on story pages: related officials, related votes, related funding, related stories, submit better source.
79. Add RSS/news quality checks to prevent noisy or irrelevant imports from publishing as authoritative RepWatchr items.
80. Add daily content report for top trending records and source gaps.

## Priority 9 - Revenue After Foundations

81. Build service request fallback forms for Quick Record Check, Local Race Source Pack, Official Record Brief, and Election Watch Desk.
82. Create `customers`, `service_requests`, `orders`, `subscriptions`, and `payment_events` tables with RLS and admin visibility.
83. Wire service cards and service CTAs to server-side Stripe Checkout with server-controlled product config.
84. Add success and cancel pages.
85. Expand Stripe webhook handling for checkout completed, subscription created, subscription updated, subscription canceled, payment failed, and refund events.
86. Add analytics events for checkout_started, checkout_completed, checkout_canceled, service_request_submitted, and subscription_started.
87. Add smoke checks for checkout session creation, missing env fallback, webhook signature validation, and redirect URLs.
88. Build sample deliverable outlines for every paid package.
89. Update terms/privacy/service policy before public checkout.
90. Keep future revenue packages hidden behind feature flags until pricing, terms, privacy, and fulfillment are approved.

## Priority 10 - Visual System Later, After Data Is Safe

91. Build a Figma design system with dark-mode-first tokens, typography, buttons, cards, charts, timelines, maps, score graphics, share cards, and admin dashboards.
92. Replace flat cards with interactive source-backed intelligence modules without breaking routes.
93. Add motion carefully: hover lighting, animated counters, graph transitions, timeline animations, and command palette interactions.
94. Add unique profile/race/school-board/story graphics and thumbnails.
95. Add charts, pie charts, bar charts, maps, and funding visuals where data supports them.
96. Fix media aspect ratios with stable responsive constraints.
97. Add visual QA screenshots for mobile, tablet, desktop, and wide desktop.
98. Run accessibility pass: semantic headings, keyboard nav, focus states, labels, contrast, no horizontal scroll.
99. Add performance pass: lazy-load heavy lists, optimize images, reduce JS bundle, avoid layout shift.
100. Only after all of the above, redesign homepage/profile/race/dashboard surfaces for the premium civic intelligence aesthetic.
