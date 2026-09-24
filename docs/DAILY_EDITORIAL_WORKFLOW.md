# Hourly RepWatchr accountability reporting

Ryan's September 23, 2026 instruction authorizes hourly political reporting and substantive article updates, prioritizing government and elected officials within roughly 50 miles of Longview. The existing Codex heartbeat now checks hourly. Publish when records support a meaningful development, not to meet a filler quota. Keep sessions bounded to five minutes to conserve usage. The Droplet separately monitors official source links hourly; that monitor does not write or publish articles. Social promotion from RepWatchr's exact owned accounts remains authorized, subject to duplicate checks and the unresolved Facebook restriction. No new paid services or ads are authorized.

## Select and verify

Check the local calendar date, current repository status, production version and existing article topic keys. Reconcile prior topic keys and publications before creating a new slug; an hourly check does not require a new article. Keep useful corrections separate from duplicate articles.

Research a current public event affecting Harleton, Harrison County, East Texas, Texas or federal public power. Favor original records and a useful local consequence. A timely deadline is a valid civic report; label it timely rather than claiming unmeasured search/social trends. Read full linked sources. RSS clips and X posts are discovery leads, and private Notion/Fieldy material supplies voice context only. Never turn a private allegation into a published fact.

Use plain English, specific dates and short paragraphs. Ryan's broad public editorial perspective is America First and conservative. Apply the same factual standards to every party. Clearly label commentary and distinguish it from confirmed facts. Do not tailor political persuasion using race, religion or personal demographics. Do not fabricate a Ryan byline, eyewitness experience, quote, review or endorsement. Use RepWatchr Editorial Desk and disclose actual AI-assisted source review when appropriate.

Keep exact quotes and paraphrase within source copyright limits. Include each source near the claims it supports where the renderer permits, plus the article's source list. For high-stakes voting instructions, use current official election sources and direct readers to the appropriate election office. If a claim is uncertain, choose another topic or state the uncertainty precisely. Do not publish unsupported accusations.

## Assemble and check

Use a unique JSON article under `src/data/news/` following the existing NewsArticle shape, or the reviewed database store when that delivery path is fully available. Include a stable topicKey, actual publishedAt/reviewedAt, truthful reviewedBy, sourceLinks, accurate distinct-publisher counts, short thumbnailMessage, metadata and useful internal links. Use `## ` paragraph headings; arbitrary HTML is not supported.

Use authentic licensed/public-authority photos with rights and provenance, or the shared typographic ArticleThumbnail/OG treatment. Never generate a person or edit an official's face to stand in for documentary photography. Do not reuse an unrelated photo as evidence of an event. Write a specific 4–8 word thumbnailMessage, ideally under 52 characters, that identifies the subject and a supported question or consequence. Do not imply hidden wrongdoing or withhold essential context just to create curiosity. Every article image must show that short headline through ArticleThumbnail on the site and the article OG renderer in shares. Inspect the actual social preview and mobile cards before publication; the complete hook must fit without clipping.

Run relevant source/editorial/SEO checks, TypeScript, lint and build. Do not mistake source-text snapshot assertions for functional proof; report failures accurately and resolve regressions. Preserve other active changes. A deploy must include only reviewed work; if unrelated unfinished changes prevent that, use an isolated release checkout or report the blocker instead of overwriting work.

The API RSS generator remains draft-only. Its own risk flags cannot approve its article. Production needs an explicitly configured model key before that generator runs; this heartbeat's source review does not require activating it.

## Publish and verify

Use the reviewed database publishing path for content-only updates; code releases use the checked release workflow in docs/DIGITALOCEAN_RUNBOOK.md. Vercel remains the public host until migration acceptance passes. Inspect the candidate release before promotion, then confirm the exact deployment and canonical `https://www.repwatchr.com/news/<slug>` return the intended article. Check its title, publication time, source links, single H1, mobile layout, readable social preview, `/blog`, `/rss.xml`, `/sitemaps/stories.xml` and the 48-hour `/news-sitemap.xml`.

Missing article routes must return 404. Publication is incomplete if only a build or commit exists. Record the URL, deploy identifier, checks and source-review outcome. Report a failure instead of claiming the story is live. Never backdate articles or refresh timestamps to simulate freshness. Corrections preserve the original record and explain the change.

## East Texas accountability desk

Follow public money and official decisions: budgets, procurement, bid tabulations, contracts, amendments, invoices, ethics disclosures, campaign finance, audits, school-board business and court dispositions. Start with Longview, Gregg County and nearby Harrison County communities, then verify the location of each expansion within the requested radius. County membership alone does not establish distance.

Ryan's voice is direct, demanding and records-first. Ask what taxpayers received, what changed, who approved it and what documentation is missing. Keep commentary labelled. An agenda is a proposed action; an unsigned resolution in a packet is not proof of passage; a large contract, out-of-town bidder, audit weakness or missing online document alone does not establish wrongdoing. Preserve the distinction between an allegation, charge, finding, plea, conviction and appeal.

The hourly server source monitor writes /var/lib/repwatchr/record-monitor/latest.json and per-source link inventories. Read the primary records, check dates and the current disposition, seek published responses, and offer a correction path before making a consequential claim. No automated contact or records-request submission without Ryan's authorization for the message.

First lead, reviewed September 23–24: Longview's September 17 fuel-station bid recommendation, master packet pages 37–40. It includes three bids and a staff recommendation. Obtain adopted minutes, signed resolution/contract and later change orders before reporting a final award or misconduct. Source: https://www.longviewtexas.gov/AgendaCenter/ViewFile/Agenda/_09172026-2331 .
