# RepWatchr Homepage Conversion Engine

## Purpose

The homepage is now a civic intelligence command center, not a static landing page.

The first screen should push every visitor into one useful loop:

1. Search a public official, board, agency, vote, source, county, or race.
2. Open the strongest public record.
3. Submit the missing source or correction.
4. Build a source packet.
5. Watch the record or dashboard.
6. Request early access to a paid public-record package when the intent is high.

The homepage must never fake activity, fake urgency, fake scarcity, or fake trend data.

## Core Sections

### Hero Intelligence Console

The hero uses the existing `PredictiveSearchBox` so homepage search is connected to the same search API and visitor-intelligence path as the rest of the site.

Hero requirements implemented:

- RepWatchr name and tagline: `Search. Grade. Source. Share.`
- Command-center framing.
- Large predictive search field.
- Keyboard shortcut hint.
- Quick chips for Texas, Congress, sheriffs, judges, school boards, source submission, free packet, and race watch.
- Search focus and submit events.

### Live Public Record Counters

Counters use existing public data helpers:

- `getRepWatchrDataStats()`
- `getSchoolBoardStats()`

Real numbers shown:

- Public profiles.
- Source URLs.
- Officials tracked.
- Jurisdiction signals.
- Record rows loaded.

Production-only metrics stay honest:

- Source submissions: `Appears after data collection starts.`
- Watched profiles: `Appears after data collection starts.`
- Packets built: `Appears after packet saves start.`

### Action Grid

The action grid routes visitors into:

- Search an official.
- Follow a race.
- Check funding.
- Read vote history.
- Submit public source.
- Build source packet.
- Request correction.
- Watch profile updates.

Each card is a real link and tracks `homepage_action_card_clicked`.

### Recently Updated Profiles

Profile cards are derived from loaded federal/state official data.

Each card shows:

- Name.
- Office/jurisdiction.
- Photo with initials fallback.
- Source count from source URLs attached to profile, funding, votes, photo source, website, and red flags.
- Completeness label.
- Confidence/status label.
- Last updated when a real date exists.
- Vote/funding/red-flag indicators.
- Open/watch and submit-source actions.

No profile activity is invented.

### Source Gaps

Source gaps are generated from loaded data where possible:

- Missing official website source.
- Missing campaign finance source.
- Missing vote record source.
- Missing profile photo/source credit.

The school-board meeting-minutes gap is a standing local-intake lane because school-board agendas, minutes, and videos are a core RepWatchr data need.

### Trending Civic Interest

The homepage does not show fake trending data.

Until aggregate analytics are wired, the section shows:

`Trend data appears after visitor activity starts.`

### Free Source Packet Funnel

The packet funnel pushes low-friction conversion:

- Build Free Packet.
- Submit Source Instead.

It tracks:

- `homepage_packet_funnel_viewed`
- `homepage_packet_started`
- `homepage_source_gap_clicked`

### Watchlist / Dashboard Funnel

The watchlist funnel routes users to:

- `/create-account`
- `/dashboard`

Copy avoids overpromising alerts or email digests until production consent, notification preferences, and email delivery are fully verified.

### Future Package Interest

Package cards use the existing package catalog in `src/data/repwatchr-packages.ts`.

Homepage package cards link to package pages and track `homepage_package_interest_clicked`.

Payment is not launched from the homepage. Checkout should stay behind `ENABLE_PAYMENTS`.

### Trust Standards

Trust copy anchors the homepage:

- Public records first.
- Source labels visible.
- Corrections stay open.
- No private home addresses.
- No doxxing or threats.
- No unsourced criminal accusations.
- Under-review items stay labeled.
- Safe share snippets only.

## Analytics Events

Homepage events registered in `src/lib/analytics-taxonomy.ts`:

- `homepage_open`
- `homepage_search_focus`
- `homepage_search_submit`
- `homepage_quick_chip_clicked`
- `homepage_counter_clicked`
- `homepage_action_card_clicked`
- `homepage_recent_profile_clicked`
- `homepage_source_gap_clicked`
- `homepage_packet_funnel_viewed`
- `homepage_packet_started`
- `homepage_watchlist_cta_clicked`
- `homepage_package_interest_clicked`
- `homepage_trust_box_clicked`

## SEO

The homepage exports metadata through `getPageMetadata()`.

Included:

- Title.
- Description.
- Canonical URL.
- Open Graph image route.
- Twitter large image metadata.
- Organization JSON-LD.
- WebSite/SearchAction JSON-LD.
- Dataset JSON-LD.

## Safety Rules

Homepage copy should not:

- Publish unsourced allegations.
- Use guilt-by-association language.
- Suggest a donation, vote, source gap, or public record proves wrongdoing by itself.
- Display private home addresses, private family details, or minor-child data.
- Imply fake trend activity or fake demand.
- Show checkout unless payments are explicitly enabled and tested.

## Next Improvements

1. Wire homepage counters to production analytics once Supabase is live.
2. Add real trending aggregate cards from anonymous analytics.
3. Add real watch counts only after watchlist tables are production verified.
4. Add real packet totals only after packet saves are production verified.
5. Add homepage screenshot regression checks for mobile and desktop.
6. Add a homepage-specific OG image variant if the generic OG route is not enough.
