# Daily RepWatchr reporting

Ryan authorized one daily political article and its publication on September 7, 2026. The Codex thread heartbeat runs at 8 a.m. America/Chicago. A saved schedule is not evidence of a successful daily publication: verify the live article each run. This workflow does not authorize social posting, ads, paid provider purchases, or private data publication.

## Select and verify

Check the local calendar date, current repository status, production version and existing article topic keys. Publish at most one new daily report per local date; retries reconcile the prior result before creating a new slug. Keep useful corrections separate from duplicate articles.

Research a current public event affecting Harleton, Harrison County, East Texas, Texas or federal public power. Favor original records and a useful local consequence. A timely deadline is a valid civic report; label it timely rather than claiming unmeasured search/social trends. Read full linked sources. RSS clips and X posts are discovery leads, and private Notion/Fieldy material supplies voice context only. Never turn a private allegation into a published fact.

Use plain English, specific dates and short paragraphs. Ryan's broad public editorial perspective is America First and conservative. Apply the same factual standards to every party. Clearly label commentary and distinguish it from confirmed facts. Do not tailor political persuasion using race, religion or personal demographics. Do not fabricate a Ryan byline, eyewitness experience, quote, review or endorsement. Use RepWatchr Editorial Desk and disclose actual AI-assisted source review when appropriate.

Keep exact quotes and paraphrase within source copyright limits. Include each source near the claims it supports where the renderer permits, plus the article's source list. For high-stakes voting instructions, use current official election sources and direct readers to the appropriate election office. If a claim is uncertain, choose another topic or state the uncertainty precisely. Do not publish unsupported accusations.

## Assemble and check

Use a unique JSON article under `src/data/news/` following the existing NewsArticle shape, or the reviewed database store when that delivery path is fully available. Include a stable topicKey, actual publishedAt/reviewedAt, truthful reviewedBy, sourceLinks, accurate distinct-publisher counts, short thumbnailMessage, metadata and useful internal links. Use `## ` paragraph headings; arbitrary HTML is not supported.

Use authentic licensed/public-authority photos with rights and provenance, or the existing typographic RecordVisual/OG treatment. Never generate a person or edit an official's face to stand in for documentary photography. Do not reuse an unrelated photo as evidence of an event. Inspect the actual social preview before publication.

Run relevant source/editorial/SEO checks, TypeScript, lint and build. Do not mistake source-text snapshot assertions for functional proof; report failures accurately and resolve regressions. Preserve other active changes. A deploy must include only reviewed work; if unrelated unfinished changes prevent that, use an isolated release checkout or report the blocker instead of overwriting work.

The API RSS generator remains draft-only. Its own risk flags cannot approve its article. Production needs an explicitly configured model key before that generator runs; this heartbeat's source review does not require activating it.

## Publish and verify

Use the existing authenticated GitHub/Vercel project workflow. Inspect the candidate release before promotion, then confirm the exact deployment and canonical `https://www.repwatchr.com/news/<slug>` return the intended article. Check its title, publication time, source links, single H1, mobile layout, readable social preview, `/blog`, `/rss.xml`, `/sitemaps/stories.xml` and the 48-hour `/news-sitemap.xml`.

Missing article routes must return 404. Publication is incomplete if only a build or commit exists. Record the URL, deploy identifier, checks and source-review outcome. Report a failure instead of claiming the story is live. Never backdate articles or refresh timestamps to simulate freshness. Corrections preserve the original record and explain the change.
