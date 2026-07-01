# RepWatchr Figma Screen Blueprint

Figma file: https://www.figma.com/design/d6dQxrIDKWPwy7MG3uSSfY

Figma page created/updated by this pass:

- `07 Screen Blueprint`

Design language name: **Civic Intelligence Terminal**

This document is the screen-level handoff for RepWatchr. It is meant for Figma, Figma Make, a designer, or a code agent. It defines what every major screen should contain, how it behaves, what data it needs, what should happen on mobile, and where the screen maps to the codebase.

## Product Rule

RepWatchr is a civic operating system, not a static database.

Every screen must create another useful click:

- Search.
- Open a record.
- Watch a profile, race, jurisdiction, or issue.
- Submit a missing source.
- Build a packet.
- Copy a safe share line.
- Request a correction.
- Open a related profile, source, race, story, or public question.

No screen should end with a dead blank state.

## Figma Page Structure

Create or maintain these Figma pages or sections:

1. Cover
2. Brand Tokens
3. Typography
4. Colors
5. Effects
6. Components
7. Homepage
8. Search
9. Profile Dossier
10. Source Submission
11. Source Packet Builder
12. Public Records Request Tool
13. Member Dashboard
14. Admin Dashboard
15. Package Interest Pages
16. Election/Race Hub
17. County/State Hub
18. Law Enforcement Profile
19. School Board Tracker
20. Mobile App Shell
21. OG/Social Cards
22. Empty States
23. Error States
24. Loading States

## Global Screen Shell

All major public/product screens should use:

- Dark navy/black civic background.
- Faint grid layer.
- Subtle noise texture.
- Radial blue/red/amber depth.
- Glass panels with 1px translucent borders.
- Source-node accents, used only for source-backed or interactive areas.
- Sticky action rail on desktop where the page has research actions.
- Mobile action dock on public and dashboard pages.

Do not put large flat white panels on top of the dark shell unless the panel is intentionally a document preview.

## Global Data And Safety Rules

- Numbers must be real, explicitly sample, or hidden.
- User-submitted claims are under review until an admin approves them.
- Red, warning, and allegation states must include a status label and source context.
- No private home addresses, minor children, private family details, threats, doxxing, or unsupported criminal accusations.
- Campaign finance displays must say that donations do not imply wrongdoing by themselves.
- Law enforcement, court, and prosecutor screens must show public-role boundaries.

## Screen 1: Homepage

Route: `/`

Code map:

- `src/app/page.tsx`
- `src/components/home/HomepageTelemetry.tsx`
- `src/components/shared/PredictiveSearchBox.tsx`
- `docs/HOMEPAGE_CONVERSION_ENGINE.md`

Purpose:

The homepage is the public entry command center. It should turn a cold visitor into an active search, source submission, packet build, watchlist intent, or package-interest lead.

Desktop layout at 1440:

- Full-width cinematic shell.
- Left: hero console with RepWatchr name, tagline, headline, subheadline, predictive search, keyboard hint, quick chips.
- Right: “Start with a receipt” command stack and two large source/packet buttons.
- Below: real counters, action cards, recent profiles, source gaps, trend placeholder, packet funnel, watchlist funnel, package interest, trust standards, final CTA.
- Desktop sticky rail on the right edge.

Mobile layout at 390:

- Search must be within the first screen.
- Right-side command stack moves below hero.
- Counters become single-column or two-column cards.
- Recent profile cards become vertical.
- Sticky desktop rail is hidden.
- Mobile action dock is fixed bottom: Search, Source, Packet, Watch, Dashboard.

Primary components:

- CivicBackground
- PredictiveSearchBox
- MetricCard
- ProfileCard
- SourceGapCard
- PackageInterestCard
- TrustExplainerBox
- MobileActionDock
- StickyActionRail

Required interactions:

- Search focus: `homepage_search_focus`
- Search submit: `homepage_search_submit`
- Quick chip click: `homepage_quick_chip_clicked`
- Counter click: `homepage_counter_clicked`
- Action card click: `homepage_action_card_clicked`
- Recent profile click: `homepage_recent_profile_clicked`
- Source gap click: `homepage_source_gap_clicked`
- Packet CTA: `homepage_packet_started`
- Watchlist CTA: `homepage_watchlist_cta_clicked`
- Package interest click: `homepage_package_interest_clicked`

Empty states:

- Trend data: “Trend data appears after visitor activity starts.”
- Source submissions: “Appears after data collection starts.”
- Packets built: “Appears after packet saves start.”

## Screen 2: Search

Route: `/search`

Code map:

- `src/app/search/page.tsx`
- `src/components/search/SearchDiscovery.tsx`
- `src/components/search/CommandPalette.tsx`
- `src/lib/search-discovery.ts`
- `docs/SEARCH_DISCOVERY_SYSTEM.md`

Purpose:

Search must find officials, offices, jurisdictions, agencies, races, stories, sources, issues, votes, and funding records quickly.

Desktop layout:

- Command-style search hero.
- Left filter rail for entity type, state, county, city, office level, office type, source count, completeness, votes, funding, source gaps, recently updated, watched.
- Main results area with grid/list toggle.
- Right utility stack: saved search, trending searches, no-result source CTA, high-intent package interest.

Mobile layout:

- Search input first.
- Filters collapse into drawer.
- Results become stacked cards.
- Map/list toggle appears as segmented control placeholder.
- Save search and submit missing source stay visible after no-result searches.

Result card fields:

- Title.
- Entity type.
- Office/jurisdiction.
- Source count.
- Completeness label.
- Trust label.
- Watch button.
- Submit source button.
- Open profile.

Required interactions:

- `search_page_open`
- `search_query_started`
- `search_query_submitted`
- `search_filter_used`
- `search_sort_changed`
- `search_result_clicked`
- `search_no_results`
- `saved_search_created`

No-result state:

Message:

“RepWatchr does not have that record yet. Submit the public source, request a correction, or build a packet with what you found.”

Actions:

- Submit missing official.
- Submit source.
- Build packet.
- Request Official Record Brief.

## Screen 3: Profile Dossier

Route: `/officials/[id]`

Code map:

- `src/app/officials/[id]/page.tsx`
- `src/components/officials/OfficialHero.tsx`
- `src/components/officials/ProfileCompletenessRing.tsx`
- `src/components/officials/SourceTrail.tsx`
- `src/components/officials/OfficialTimeline.tsx`
- `src/components/officials/PublicQuestionCard.tsx`
- `src/components/profile/VerifiedPoliticalFeedbackPanel.tsx`

Purpose:

The profile page should read like a source-backed public dossier that can survive hostile review.

Desktop layout:

- Hero: photo, name, office, jurisdiction, party, source count, score/status, watch/share/source/correction actions.
- Record Summary: confirmed vs needs review.
- Source Trail.
- Score and methodology.
- Vote-weighted left/right chart.
- Constitutional or methodology score if available, with confidence label.
- Issue scorecard.
- Voting record.
- Funding.
- Timeline.
- Public questions.
- Related profiles and relationship graph.
- Red flags/controversies below votes/funding/source evidence.

Mobile layout:

- Hero becomes stacked.
- Action buttons become horizontal dock or two-row control cluster.
- Score modules use compact cards.
- Vote/funding tables become cards.
- Graph view defaults to list.

Safety:

- Red flags only source-backed or clearly labeled under review/public question.
- Campaign finance neutral disclaimer visible near funding.
- Score explanation must state whether there is insufficient data.

Required interactions:

- `profile_open`
- `profile_section_viewed`
- `profile_watch_clicked`
- `profile_share_clicked`
- `source_clicked_from_profile`
- `submit_source_clicked_from_profile`
- `correction_clicked_from_profile`

## Screen 4: Source Submission

Routes:

- `/submit-source`
- `/sources/submit`

Code map:

- `src/components/sources/SourceSubmission.tsx`
- `src/components/intake/FormComponents.tsx`
- `src/lib/source-submissions.ts`
- `docs/SOURCE_SUBMISSION_SYSTEM.md`
- `docs/DATA_INTAKE_SYSTEM.md`

Purpose:

Collect public source submissions in a structured queue without auto-publishing claims.

Desktop layout:

- Stepper shell.
- Step 1: source URL.
- Step 2: target official/agency/board/race.
- Step 3: jurisdiction.
- Step 4: source type/date.
- Step 5: claim/question summary.
- Step 6: what needs to be checked.
- Right side: live source packet preview and safety rules.

Mobile layout:

- One step per screen.
- Sticky bottom Continue/Back.
- Source packet preview collapses below.
- Honeypot/spam controls are invisible.

Success state:

- Submission ID.
- Copyable source packet.
- Next suggested action.
- Share link back to RepWatchr.
- Create account CTA.

Required interactions:

- `source_submit_started`
- `source_url_entered`
- `source_target_selected`
- `source_packet_previewed`
- `source_submit_completed`
- `source_submit_failed`

## Screen 5: Source Packet Builder

Routes:

- `/free-packet`
- `/tools/source-packet-builder`

Code map:

- `src/components/tools/SourcePacketBuilder.tsx`
- `src/lib/source-packet-tools.ts`
- `docs/SOURCE_PACKET_BUILDER.md`

Purpose:

Turn one public source into a clean, shareable, correction-safe packet.

Desktop layout:

- Split screen.
- Left: packet fields and source URL input.
- Right: live document preview with 8.5:11 ratio.
- Safety warning rail.
- Copy/export/submit/save controls.

Mobile layout:

- Stepper form.
- Preview appears after required fields.
- Copy/export buttons stay sticky after packet generation.

Document preview hierarchy:

1. Target.
2. Jurisdiction.
3. Source URL.
4. What it appears to show.
5. What it does not prove.
6. Missing proof.
7. Public question.
8. Next record to pull.

Required interactions:

- `packet_builder_started`
- `packet_generated`
- `packet_copied`
- `packet_saved`
- `packet_submitted`
- `packet_account_prompt_clicked`

## Screen 6: Public Records Request Tool

Route: `/tools/public-records-request`

Code map:

- `src/components/tools/RecordsRequestBuilder.tsx`
- `docs/PUBLIC_RECORDS_REQUEST_TOOL.md`

Purpose:

Generate public-record request drafts, follow-ups, and clarification responses.

Desktop layout:

- Guided builder on left.
- Generated request preview on right.
- Tabs: full request, short email, follow-up, overdue follow-up, denial/clarification starter.
- Status save controls.

Mobile layout:

- One field group per step.
- Preview shown in document card after generation.
- Copy action fixed below preview.

Disclaimer:

“Public-records research tool, not legal advice.”

Required interactions:

- `records_request_started`
- `records_request_generated`
- `records_request_copied`
- `records_request_saved`

## Screen 7: Member Dashboard

Route: `/dashboard`

Code map:

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/MemberDashboardShell.tsx`
- `src/components/dashboard/MemberCommandCenter.tsx`
- `src/components/dashboard/MemberWatchlistOffice.tsx`
- `src/components/dashboard/MemberFreeToolsOffice.tsx`

Purpose:

Make RepWatchr feel like a tool, not just a website.

Desktop layout:

- Intelligence summary.
- Watchlist modules.
- Recent changes.
- Source submissions.
- Source packet drafts.
- Records request drafts.
- Contributor score.
- Digest preferences.
- Package interest.

Mobile layout:

- Summary first.
- Cards by priority: watchlist, submissions, packets, records drafts, settings.
- Bottom dock variant: Search, Watchlists, Packet, Submit, Settings.

Required interactions:

- `dashboard_open`
- `dashboard_module_open`
- `dashboard_next_action_clicked`
- `watchlist_open`
- `dashboard_packet_started`
- `digest_settings_changed`

## Screen 8: Admin Dashboard

Route family: `/admin/*`

Code map:

- `src/app/admin/page.tsx`
- `src/components/admin/AdminControlCenterClient.tsx`
- `src/components/intake/AdminIntakeClient.tsx`
- `src/components/admin/BehavioralAnalyticsDashboard.tsx`
- `src/components/admin/MonetizationReadinessDashboard.tsx`

Purpose:

Dense, secure command center for review, corrections, analytics, data health, and monetization readiness.

Desktop layout:

- Overview metrics.
- Source review queue.
- Correction queue.
- Analytics.
- Data health.
- Monetization readiness.
- Audit log.
- Admin action panel.

Mobile layout:

- Admin remains usable but dense tables become horizontal scroll or cards.
- Critical queues first.
- Bulk actions hidden behind More menu.

Required safety:

- Server-side admin check.
- Admin pages noindex.
- Audit log for status changes.
- Internal notes never public.

Required interactions:

- `admin_open`
- `admin_module_open`
- `admin_form_opened`
- `admin_form_status_changed`
- `admin_source_review_completed`
- `admin_audit_log_opened`

## Screen 9: Package Interest Pages

Route family:

- `/packages`
- `/packages/[packageSlug]`

Code map:

- `src/components/packages/PackageLandingPage.tsx`
- `src/components/packages/PackageInterestCard.tsx`
- `src/components/packages/PackageInterestModal.tsx`
- `src/data/repwatchr-packages.ts`
- `docs/PACKAGE_INTEREST_SYSTEM.md`

Purpose:

Collect demand before payment launch.

Required sections:

- Premium hero.
- Who it is for.
- What you get.
- What you do not get.
- Deliverable preview.
- Source-first guarantee.
- Safety/disclaimer.
- Interest form.
- Related free tools.
- FAQ.
- No checkout by default.

Mobile layout:

- Hero, CTA, deliverable preview, package bullets, form.
- FAQ accordion.
- Sticky request access CTA.

Required interactions:

- `package_page_open`
- `package_interest_clicked`
- `package_interest_submitted`
- `package_faq_open`
- `free_tool_clicked_from_package`

## Screen 10: Election/Race Hub

Route family:

- `/elections`
- `/elections/texas`
- `/elections/texas/[raceSlug]`

Code map:

- `src/app/elections/page.tsx`
- `src/app/elections/texas/page.tsx`
- `src/app/elections/texas/[raceSlug]/page.tsx`
- `src/data/texas-election-races.ts`

Purpose:

Own local civic search around races, candidates, filings, finance, questions, and source gaps.

Desktop layout:

- Race hero with office, jurisdiction, election date, source count.
- Candidate comparison.
- Incumbent label.
- Official election source links.
- Campaign website links.
- Filing links.
- Finance links.
- Source gaps.
- Voter question builder.
- Watch race.
- Request Race Source Pack.

Mobile layout:

- Candidate comparison becomes stacked cards.
- Filing/source links become compact rows.
- Watch/Share/Source remains sticky.

## Screen 11: County/State Hub

Suggested route family:

- `/jurisdictions/[slug]`
- `/states`
- `/states/[state]`

Purpose:

Local SEO and local civic search surface.

Desktop layout:

- Jurisdiction hero.
- Stats cards.
- Search within jurisdiction.
- Officials grouped by level.
- Agencies/public bodies.
- Races and elections.
- Source gaps.
- Recently updated.
- Public questions.
- Package interest.
- Trust box.

Mobile layout:

- Search within jurisdiction first after hero.
- Groups collapse into accordions.
- Source gaps become primary action cards.

## Screen 12: Law Enforcement Profile

Route can reuse profile route or public-safety route:

- `/public-safety/[slug]`
- `/officials/[id]`

Code map:

- `src/app/public-safety/[slug]/page.tsx`
- `src/components/power-watch/*`
- `docs/PUBLIC_PROFILE_BOUNDARIES.md`

Purpose:

Public-role-only profile for sheriffs, chiefs, constables, prosecutors, judges, and badge/court power roles.

Required public boundary box:

“This profile covers public-role records only. RepWatchr does not publish private home addresses, minor children, or harassment instructions. Submit corrections or public sources below.”

Required sections:

- Public role.
- Agency/court affiliation.
- Official source trail.
- Policies/manuals.
- Public records.
- Incident/case mentions only if source-backed and admin approved.
- Correction/safety CTAs.

Visual style:

- Serious and restrained.
- No siren, vigilante, mugshot, or wanted-poster design.

## Screen 13: School Board Tracker

Route family:

- `/school-boards`
- `/school-boards/[districtSlug]`

Code map:

- `src/app/school-boards/page.tsx`
- `src/app/school-boards/[districtSlug]/page.tsx`
- `src/components/school-board/*`

Purpose:

Track district overview, board members, meetings, agendas, minutes, votes, policies, source gaps, and public questions.

Desktop layout:

- District hero.
- Board member grid.
- Meetings.
- Agendas/minutes/video links.
- Votes.
- Policies.
- Source gaps.
- Public questions.
- Watch district.
- School Board Monitor interest.

Mobile layout:

- Member cards.
- Meeting timeline.
- Agenda/minutes/video links as icon rows.
- Watch/Source dock.

## Screen 14: Mobile App Shell

Code map:

- `src/components/search/CommandPalette.tsx`
- `src/components/officials/ProfileActionDock.tsx`
- homepage mobile dock in `src/app/page.tsx`

Purpose:

Make RepWatchr usable from social links, text messages, meetings, and quick searches.

Required mobile actions:

- Search.
- Watch.
- Source.
- Packet.
- Dashboard.

Mobile shell behavior:

- Bottom dock respects safe-area inset.
- Command palette opens from search action.
- Share drawer uses Web Share API when supported.
- Tables become cards.
- Timeline is vertical.
- Graph views default to list.

## OG/Social Card Specs

Route: `/api/og`

Code map:

- `src/app/api/og/route.tsx`

Required card types:

- Homepage.
- Profile.
- Race.
- Source packet.
- Story.
- Package.
- County hub.

Frame:

- 1200 x 630.
- Dark civic background.
- RepWatchr logo/name.
- Page type label.
- Entity/story title.
- Jurisdiction.
- Source count or source label.
- Short line: “Search. Grade. Source. Share.”

Text must be readable in small mobile previews.

## Empty, Error, And Loading States

Every state must include a next action.

Examples:

- Empty search: submit source, request review, build packet.
- Empty watchlist: search official, watch race, create packet.
- Missing funding: submit finance source, request record brief.
- Broken source: report broken link, submit better source.
- Loading table: skeleton rows, no layout shift.
- Under review: show status, do not imply verification.

## Screen Checklist

For each screen before implementation:

- [ ] Desktop 1440 frame exists.
- [ ] Laptop 1280 frame exists or is derived.
- [ ] Tablet 768 frame exists or is derived.
- [ ] Mobile 390 frame exists.
- [ ] Primary action is visible above the fold.
- [ ] Secondary action is visible before page end.
- [ ] Empty state has next action.
- [ ] Error state has recovery path.
- [ ] Loading state avoids layout shift.
- [ ] Analytics events are named.
- [ ] SEO/index/noindex decision is documented.
- [ ] Safety labels are present where claims appear.
- [ ] Private/admin data is not visible publicly.
