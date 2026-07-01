# RepWatchr Event Taxonomy

Source of truth: `src/lib/analytics-taxonomy.ts`

Events should be short, explicit, and behavior-based. Do not create event names that imply proof, guilt, ideology, or political intent beyond the user action.

## Navigation

- `page_view`
- `nav_click`
- `footer_click`
- `internal_link_click`
- `external_source_click`
- `next_action_click`
- `command_palette_open`

## Search

- `global_search_started`
- `global_search_submitted`
- `global_search_result_clicked`
- `official_search`
- `race_search`
- `issue_search`
- `county_search`
- `no_results_seen`
- `filter_used`
- `sort_changed`
- `saved_search_created`

## Profiles

- `profile_open`
- `profile_section_viewed`
- `source_trail_opened`
- `vote_table_opened`
- `funding_table_opened`
- `timeline_opened`
- `red_flag_opened`
- `correction_clicked`
- `profile_share_clicked`
- `profile_watch_clicked`
- `profile_compare_clicked`

## Data Intake

- `source_submit_started`
- `source_url_entered`
- `source_target_selected`
- `source_submit_completed`
- `source_submit_failed`
- `correction_submit_started`
- `correction_submit_completed`
- `packet_builder_started`
- `packet_builder_completed`
- `records_request_created`
- `attachment_uploaded`

## Engagement

- `feedback_vote_clicked`
- `useful_vote_clicked`
- `needs_source_vote_clicked`
- `source_quality_vote_clicked`
- `public_question_copied`
- `share_snippet_copied`
- `native_share_clicked`
- `social_share_clicked`
- `watchlist_add`
- `watchlist_remove`
- `digest_signup`
- `account_prompt_seen`
- `account_prompt_clicked`

## Dashboard

- `dashboard_open`
- `dashboard_module_open`
- `watchlist_open`
- `packet_open`
- `saved_search_open`
- `digest_settings_changed`

## Admin

- `admin_open`
- `admin_source_review_started`
- `admin_source_review_completed`
- `admin_profile_updated`
- `admin_story_published`
- `admin_wire_item_quarantined`
- `admin_duplicate_merged`

## Monetization Readiness

- `package_card_viewed`
- `package_interest_clicked`
- `package_interest_submitted`
- `pricing_interest_clicked`
- `waitlist_joined`
- `research_request_started`
- `research_request_completed`
- `checkout_started`
- `checkout_completed`

## Diagnostics

- `scroll_depth`
- `time_spent`
- `heatmap_click`
- `exit`
- `download`
- `route_depth`

## Interest Families

- `geography`
- `office_type`
- `issue`
- `source_type`
- `engagement_type`
- `data_product`
- `monetization_signal`

## Interest Keys

Examples:

- `texas`
- `federal`
- `state_legislature`
- `congress`
- `sheriff`
- `judge`
- `prosecutor`
- `school_board`
- `city_council`
- `county_commissioner`
- `campaign_finance`
- `votes`
- `meeting_minutes`
- `open_records`
- `property_taxes`
- `public_safety`
- `education`
- `courts`
- `elections`
- `ethics`
- `official_brief_interest`
- `race_pack_interest`
- `watch_desk_interest`
- `api_interest`

## Interest Weights

- Page view: 1
- Section view: 1
- Profile view: 3
- Search: 4
- Source click: 4
- Feedback vote: 5
- Share: 6
- Watch: 8
- Source submit: 10
- Packet build: 10
- Package interest click: 12
- Account creation: 15

## Legacy Event Aliases

The API accepts older event names from existing components and maps them to canonical events:

- `profile_view` -> `profile_open`
- `search` -> `global_search_submitted`
- `button_click` -> `next_action_click`
- `share` -> `share_snippet_copied`
- `source_submission` -> `source_submit_completed`
- `packet_creation` -> `packet_builder_completed`
- `watch_record` -> `profile_watch_clicked`
- `admin_dashboard_opened` -> `admin_open`

This keeps old UI code working while new analytics reporting uses one event language.
