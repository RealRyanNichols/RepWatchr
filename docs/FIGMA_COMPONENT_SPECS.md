# RepWatchr Figma Component Specs

Design system: **Civic Intelligence Terminal**

Code anchor:

- `src/components/design-system/RepWatchrCivic.tsx`
- `src/components/design-system/index.ts`
- `docs/COMPONENT_INVENTORY.md`
- `docs/VISUAL_LANGUAGE.md`

This document defines the Figma component API. Figma component names should match code names wherever possible.

Naming pattern:

`Civic Intelligence Terminal / Component Name / Variant`

Example:

`Civic Intelligence Terminal / SourceLabel / Needs Source`

## Component State Requirements

Every interactive component needs:

- Default.
- Hover.
- Focus.
- Active/pressed where relevant.
- Loading where data or submission occurs.
- Disabled where action is unavailable.
- Empty state where content can be missing.
- Error state where validation or fetch can fail.

Focus states must be visible on dark backgrounds and cannot rely on color alone.

## Component Map

| Component | Code map | Purpose | Primary analytics |
| --- | --- | --- | --- |
| CivicBackground | `RepWatchrCivic.tsx` | Dark shell, grid, glow, noise | `page_view` |
| GlassPanel | `RepWatchrCivic.tsx` | Primary data surface | context-specific |
| Button / ElasticButton | `RepWatchrCivic.tsx` | Primary command action | context-specific |
| IconButton | shared/action components | Dense icon action | context-specific |
| WatchButton | `components/civic/WatchButton.tsx` | Watch official/race/record | `profile_watch_clicked`, `watchlist_add` |
| ShareButton | `RepWatchrCivic.tsx`, `ShareDrawer.tsx` | Open share drawer/native share | `share_menu_open` |
| SubmitSourceButton | source components | Send public source | `source_submit_started` |
| FeedbackButton | `FeedbackCluster.tsx` | Useful/needs-source/broken-source | `feedback_vote_clicked` |
| SourceLabel | `RepWatchrCivic.tsx` | Trust vocabulary | none |
| ConfidenceLabel | trust components | Source/confidence state | none |
| CorrectionBadge | trust components | Correction status | none |
| MetricCard | `RepWatchrCivic.tsx` | Real count or honest placeholder | `homepage_counter_clicked` |
| ProfileCard | `OfficialCard.tsx`, `ProfileCard` pattern | Open official/candidate | `profile_open` |
| SearchResultCard | `SearchDiscovery.tsx` | Search result with actions | `search_result_clicked` |
| SourceCard | source/trail components | One public source | `external_source_click` |
| SourceTrail | `SourceTrail.tsx` | Source list | `source_trail_opened` |
| TimelineEvent | `OfficialTimeline.tsx`, `VoteTimeline.tsx` | Public timeline item | `timeline_opened` |
| PublicQuestionCard | `PublicQuestionCard.tsx` | Copy safe question | `public_question_copied` |
| PackageInterestCard | `PackageInterestCard.tsx` | Demand signal | `package_interest_clicked` |
| DashboardPanel | dashboard components | Member/admin module | `dashboard_module_open` |
| AdminTable | admin primitives | Queue/table operations | `admin_module_open` |
| CommandPalette | `CommandPalette.tsx` | Global keyboard search | `command_palette_open` |
| MobileActionDock | homepage/profile dock | Mobile primary actions | context-specific |
| StickyActionRail | profile/homepage rail | Desktop persistent actions | context-specific |
| SourcePacketPreview | `SourcePacketBuilder.tsx` | Document preview | `packet_generated` |
| RecordsRequestPreview | `RecordsRequestBuilder.tsx` | Request preview | `records_request_generated` |
| EmptyState | shared pattern | Next action after no data | context-specific |
| LoadingSkeleton | shared pattern | Stable loading | none |
| ErrorNotice | shared pattern | Recoverable error | context-specific |
| PrivacyNotice | trust/privacy components | Boundaries and consent | `privacy_control_used` |

## 1. CivicBackground

Purpose:

Provides the dark page shell with radial depth, faint grid, subtle noise, and optional source-node glow.

Props/data:

- `sourceGlow: boolean`
- `children`
- `surface: public | dashboard | admin | packet | profile`

Desktop:

- Full viewport width.
- Background grid fixed behind content.
- Inner content uses max width by screen context.

Mobile:

- Same background, reduced glow intensity.
- Avoid fixed decorative elements that cause jank.

States:

- Default.
- SourceGlow.
- ReducedMotion.

Accessibility:

- Decorative grid/noise cannot carry meaning.
- Contrast remains readable without background effects.

## 2. GlassPanel

Purpose:

Primary container for data, forms, cards, queues, previews, and modules.

Props/data:

- `variant: default | raised | source | warning | danger | verified`
- `density: compact | normal | roomy`
- `interactive: boolean`
- `title?`
- `description?`

Desktop:

- Radius 24 to 32.
- 1px translucent border.
- Soft shadow.
- Optional top stripe only when useful.

Mobile:

- Radius 20 to 24.
- Padding drops one step.
- Full-width with no horizontal overflow.

States:

- Hover: lift 2 to 4px, border glow.
- Focus: 2px outline/ring.
- Loading: internal skeleton, no layout collapse.
- Empty: message plus action.
- Error: danger border and recovery action.

## 3. Button

Purpose:

Clear command action.

Variants:

- Primary blue.
- Source cyan.
- Warning amber.
- Danger red.
- Verified green.
- Ghost.
- Outline.

Props/data:

- `label`
- `icon?`
- `href?`
- `disabled?`
- `loading?`
- `destructive?`

Desktop:

- Minimum height 44px.
- Icon left for action type; arrow right only for navigation.

Mobile:

- Minimum height 48px.
- Full width inside forms; intrinsic width in docks/toolbars.

States:

- Hover: lift and glow.
- Focus: visible ring.
- Loading: spinner or pulsing dot plus disabled pointer.
- Disabled: 50 percent opacity, no hover shift.

Accessibility:

- Do not use icon-only button without `aria-label`.
- Text must fit; no viewport-based font scaling.

## 4. IconButton

Purpose:

Compact actions such as share, copy, watch, filter, close, and menu.

Props/data:

- `icon`
- `label`
- `tone`
- `selected`
- `disabled`

Desktop:

- 40 to 44px square.
- Tooltip on hover/focus.

Mobile:

- 44 to 52px square.
- No hover-only dependency.

## 5. WatchButton

Purpose:

Watch/unwatch officials, races, jurisdictions, records, issues, and sources.

Props/data:

- `watched`
- `loading`
- `anonymous`
- `entityType`
- `entityId`
- `watchCount?`

States:

- Default: “Watch”.
- Watched: “Watching” with green/source state.
- Anonymous: “Log in to watch” or opens account prompt.
- Loading: “Saving”.
- Error: “Try again” plus error notice.

Analytics:

- `profile_watch_clicked`
- `watchlist_add`
- `watchlist_remove`
- `anonymous_watch_intent_created`

Accessibility:

- Must be a real button.
- `aria-pressed` for watched state.

## 6. ShareButton And ShareDrawer

Purpose:

Make safe sharing easier than outrage sharing.

Drawer actions:

- Copy clean link.
- Copy safe share line.
- Native share.
- X.
- Facebook.
- LinkedIn.
- Email.
- Copy public question.
- Submit better source.
- Watch record.

Props/data:

- `title`
- `path`
- `entityType`
- `safeLine`
- `publicQuestion?`
- `sourceCount?`

Mobile:

- Bottom sheet.
- Large tap targets.
- Close button top right and Escape support.

Analytics:

- `share_menu_open`
- `share_copy_link`
- `share_copy_snippet`
- `native_share_clicked`
- `social_share_clicked`
- `public_question_copied`

Safety:

- Share snippets must not overstate proof.
- Missing-source snippets should invite source submission.

## 7. SourceLabel

Purpose:

Mandatory trust vocabulary.

Variants:

- Confirmed public record.
- Source-backed claim.
- Public question.
- Needs source.
- Allegation.
- Opinion.
- Correction requested.
- Under review.
- Insufficient data.

Figma variants:

- `Status=confirmed`
- `Status=sourceBacked`
- `Status=publicQuestion`
- `Status=needsSource`
- `Status=allegation`
- `Status=opinion`
- `Status=correctionRequested`
- `Status=underReview`
- `Status=insufficientData`

Accessibility:

- Include text label; color is secondary.

## 8. MetricCard

Purpose:

Real metrics, counters, and admin/dashboard stats.

Props/data:

- `title`
- `value`
- `subtitle`
- `sourceLabel?`
- `trend?`
- `tone`
- `emptyMessage?`

Rules:

- Never show fake activity numbers.
- If a metric is not wired, show honest text.

States:

- Real value.
- Empty/unwired.
- Loading.
- Error.

## 9. ProfileCard

Purpose:

Open an official/candidate/public role while showing trust context.

Props/data:

- `name`
- `office`
- `jurisdiction`
- `party?`
- `photo?`
- `sourceCount`
- `completeness`
- `trustLabel`
- `lastUpdated?`
- `href`

Desktop:

- Photo/avatar left or top.
- Metadata chips.
- Source count and completeness.
- Watch/source quick actions.

Mobile:

- Stacked.
- Photo 64 to 80px.
- One primary open action; secondary actions in row.

## 10. SearchResultCard

Purpose:

Search result that quickly explains what record will open.

Props/data:

- `title`
- `entityType`
- `subtitle`
- `jurisdiction`
- `sourceCount`
- `completeness`
- `tags`
- `href`

States:

- Default.
- Hover/focus.
- Watched.
- Missing source.
- Sparse/noindex candidate.

Analytics:

- `search_result_clicked`

## 11. SourceCard And SourceTrail

Purpose:

Show the receipt.

SourceCard props:

- `title`
- `url`
- `sourceType`
- `date`
- `jurisdiction`
- `label`
- `confidence`
- `attachedEntity?`

SourceTrail props:

- `sources[]`
- `groupBy`
- `showExternalIcon`

States:

- Confirmed.
- Under review.
- Broken source.
- Paywalled.
- Duplicate possible.
- Missing source.

## 12. TimelineEvent

Purpose:

Turn every source into a dated event.

Props/data:

- `date`
- `title`
- `summary`
- `eventType`
- `source`
- `trustLabel`
- `relatedEntity`

Desktop:

- Vertical line with source nodes.
- Filter chips above.

Mobile:

- Full-width event cards.
- Timeline line left.

Motion:

- Timeline line draw, reduced-motion fallback is static line.

## 13. PublicQuestionCard

Purpose:

Copy safe public questions for meetings, reporters, voters, and source checks.

Props/data:

- `question`
- `context`
- `target`
- `sourceUrl?`
- `copyLabel`

States:

- Copy idle.
- Copied.
- Needs source.

Analytics:

- `public_question_copied`

## 14. PackageInterestCard

Purpose:

Capture package demand without launching checkout.

Props/data:

- `packageKey`
- `name`
- `summary`
- `whoFor`
- `expectedTiming`
- `cta`

States:

- Default.
- Hover/focus.
- Interest submitted.
- Payments disabled.

Analytics:

- `package_interest_clicked`
- `package_interest_submitted`

## 15. DashboardPanel

Purpose:

Reusable member/admin panel.

Props/data:

- `title`
- `description`
- `actions`
- `metric?`
- `emptyState?`

Desktop:

- Grid-ready, dense but readable.

Mobile:

- Stacked; no nested cards unless repeated rows.

## 16. AdminTable

Purpose:

Admin review and data-health table.

Props/data:

- `columns`
- `rows`
- `filters`
- `bulkActions`
- `statusBadges`

Desktop:

- Sticky header.
- Dense rows.
- Clear row actions.

Mobile:

- Card list or horizontal scroll with obvious affordance.

Accessibility:

- Use table semantics where possible.
- Action buttons require labels.

## 17. CommandPalette

Purpose:

Cmd/Ctrl + K search and action launcher.

Props/data:

- `query`
- `results`
- `recent`
- `saved`
- `trending`
- `actions`

States:

- Closed.
- Open empty.
- Searching.
- Results.
- No result.
- Loading.

Analytics:

- `command_palette_open`
- `command_search_input`
- `command_result_clicked`
- `command_action_clicked`
- `command_no_result`

## 18. MobileActionDock

Purpose:

Persistent mobile action set.

Variants:

- Homepage.
- Profile.
- Story.
- Race.
- Dashboard.
- Admin.

Rules:

- Respect safe-area inset.
- 5 actions maximum.
- 44px minimum tap targets.
- Active route indicated by label and icon state.

## 19. StickyActionRail

Purpose:

Desktop persistent actions.

Actions:

- Watch.
- Share.
- Source.
- Packet.
- Correction.
- Dashboard/admin context where allowed.

Rules:

- Right side on desktop.
- Hidden on mobile.
- Tooltips on hover/focus.

## 20. SourcePacketPreview

Purpose:

Visualize the generated packet.

Layout:

- 8.5:11 document aspect.
- Header with target and jurisdiction.
- Source URL in mono.
- Summary blocks.
- Missing proof block.
- Public question block.
- Copy/export actions.

States:

- Empty draft.
- Generated.
- Copied.
- Submitted.
- Error.

## 21. RecordsRequestPreview

Purpose:

Preview public-record request drafts.

Tabs:

- Full request.
- Short email.
- Follow-up.
- Overdue follow-up.
- Denial/clarification starter.

State:

- Draft.
- Saved.
- Copied.
- Missing requester fields.

## 22. EmptyState

Purpose:

Prevent dead ends.

Props/data:

- `title`
- `description`
- `primaryAction`
- `secondaryAction?`
- `sourceGap?`

Required:

- Next action.
- Honest reason for empty state.

## 23. LoadingSkeleton

Purpose:

Stable loading with no layout shift.

Variants:

- Card.
- Table.
- Form.
- Timeline.
- Profile.
- Dashboard.

Reduced motion:

- No shimmer; use static blocks.

## 24. ErrorNotice

Purpose:

Explain failure and recovery.

Variants:

- Validation.
- Network.
- Auth required.
- Permission denied.
- Broken source.
- Unsafe content warning.

Required:

- Plain-English reason.
- Recovery action.
- Contact/source/correction route if needed.

## 25. PrivacyNotice

Purpose:

Display privacy, safety, consent, and public-record boundaries.

Use on:

- Source submission.
- Correction request.
- Public-records response intake.
- Law enforcement/court profiles.
- Dashboard privacy.
- Package pages.

Required:

- No private addresses.
- No minor children.
- No threats.
- No doxxing.
- No unsourced accusations.
- Under-review workflow.

## Figma Component QA Checklist

- [ ] Component name matches code name.
- [ ] Variants use properties, not disconnected copies.
- [ ] Default, hover, focus, loading, empty, error states exist where relevant.
- [ ] Text does not overflow at mobile width.
- [ ] Touch targets are at least 44px.
- [ ] Focus state is visible.
- [ ] Color does not carry status alone.
- [ ] Source/correction/risk states have labels.
- [ ] Component has code map note.
- [ ] Component has analytics event note where clicked.
