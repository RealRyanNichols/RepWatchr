# RepWatchr Source-of-Truth Report

Date: 2026-06-20

## Confirmed Source Of Truth

The deployed RepWatchr site is sourced from:

- GitHub repo: `RealRyanNichols/RepWatchr`
- Production branch: `main`
- Latest deployed commit checked during this pass: `97a6c54606bcf241ea77d065714750d7eec40335`
- Vercel project: `repwatchr`
- Vercel project id: `prj_6RzAP5yZQUZacVFxcQlOWxUDOD4k`
- Production domains: `repwatchr.com` and `www.repwatchr.com`

The local Drive folder `RepWatchr` is not a Git repository. It should be treated as a side copy unless intentionally reconnected.

The local Drive folder `RepWatchr-github` has Vercel metadata, but its local Git state is unhealthy: the working tree is untracked and simple Git reads can hang. It should not be used as the active editing source until repaired or recloned.

## What Changed In This Pass

- Narrowed top navigation to the actual mission: officials, authority roles, school boards, votes, red flags, stories, and source submission.
- Removed off-mission top-level promotion of feed, authors, daily watch, attorney watch, media watch, UAP, predator watch, and similar side lanes.
- Added `/authority-watch` as the public umbrella page for public officials and public-facing authority roles.
- Added `/submit-source` as the canonical public route for source submissions while keeping `/feedback` available for old links.
- Tightened site metadata away from "political attention feed" and toward source-backed public accountability.
- Cleaned `/news` page language so stories remain shareable but stay tied to records, sources, and officials.
- Simplified the `/news` background to a lighter, less noisy surface.
- Updated the sitemap so SEO emphasis follows the focused public-accountability model.

## What We Learned

RepWatchr already has strong raw material: officials, school boards, votes, funding, scorecards, red flags, articles, source links, and public-source submission paths.

The site drifted when every possible attention lane became first-class navigation. That made the mission harder to understand. The stronger frame is:

1. Find the public person or office.
2. Open the record.
3. Inspect votes, funding, red flags, and sources.
4. Submit missing public records.
5. Share the profile or story.

## Next Recommendations

1. Repair the local Git workspace by replacing `RepWatchr-github` with a clean clone outside Google Drive or by using GitHub Codespaces/Vercel-connected workflow.
2. Add a visible source-review status model: received, needs review, accepted, privacy hold, rejected.
3. Build a real admin queue for submitted sources so Ryan can approve, reject, tag, and attach records to officials.
4. Add profile-level share panels that generate safe copy tied to the official, source count, red flags, and missing records.
5. Keep articles, but make every story connect back to at least one official, school board, vote, filing, meeting, or source record.
6. Expand Texas first, then use the same data model nationally.
