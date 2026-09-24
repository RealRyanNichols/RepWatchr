# RepWatchr on the existing Droplet

The target is `leadflow-web`, 165.227.248.110. Existing Caddy sends the RepWatchr staging hostname to loopback port 3102. Supabase remains the data/auth store. No new paid infrastructure is required.

## Command center

`/admin/command-center` uses the existing admin role and server-side authentication. It reads member-profile counts, instrumented page views/clicks/opens, source totals, the article catalog, and social delivery/planner records. Unknown data is labelled unavailable. Traffic excludes recognized bots and caps detailed analysis at the latest 10,000 events, explicitly labelled when sampled. Browser IDs are not people. Counts include internal/testing traffic unless recognized as bots.

The X/Facebook manual receipts are dated checkpoints, not live account status or live social analytics. Platform impressions, follower counts and Google Search Console clicks are not connected to this report. Growth priorities are operational hypotheses, not forecasts or demographic targeting.

## Releases and recovery

Run `bash scripts/deploy-droplet.sh` on the Droplet. It fetches reviewed `origin/main`, skips the running SHA, installs and builds in a fresh directory, runs release checks, starts a loopback candidate on 3202, checks routes (explicitly retaining documented 404/redirect gaps, never server errors) and protected admin access, then switches only `site@repwatchr`. A failed post-switch health check restores the previous systemd override. A failed build leaves the running service untouched. Releases are serialized by flock.

Keep `/srv/site-env/repwatchr.env` root-readable only. Never commit or print its values. `REPWATCHR_HOSTING` and `REPWATCHR_RELEASE_SHA` identify the serving release. The runtime binds only to loopback. Caddy must strip client-supplied Vercel geography headers. The application treats geography as unknown off Vercel.

An hourly `repwatchr-release.timer` runs the installed, reviewed release script. It deploys main changes only after the same checks. Inspect `journalctl -u repwatchr-release` for results. Existing release directories are retained for rollback; review disk usage and retain at least two good releases. Stop the timer with `systemctl stop repwatchr-release.timer` if a release needs to be held.

To roll back, copy the desired previous `release.conf` into `/etc/systemd/system/site@repwatchr.service.d/release.conf`, run `systemctl daemon-reload`, restart `site@repwatchr`, then verify `/api/health/release` and the homepage. Stop the release timer first so the known-bad main commit is not retried. Revert the source before resuming.

## Domain cutover

Only after candidate checks: add `repwatchr.com` and `www.repwatchr.com` to Caddy, validate and reload it, point the apex A record at 165.227.248.110 and www CNAME at the apex, preserve unrelated mail/TXT records, and verify HTTPS, canonical redirect, article/RSS/sitemaps, auth and protected routes. Keep Vercel available for rollback while DNS propagates. The apex redirects to www in the application.

## Scheduled editorial work

Hosting/release automation does not run Codex editorial sessions. The existing hourly accountability publishing heartbeat remains responsible for source-checked writing, exact owned-account verification and platform receipts; it may depend on the desktop being available. Do not silently replace it with unattended accusations, paid-model calls or duplicate social jobs.

Vercel currently defines daily-updates and hourly-social-posts cron routes. A full domain migration must transfer those schedules exactly once, with bearer authentication and gates preserved, before removing Vercel scheduling. Facebook remains held until the recorded account restriction is resolved. Do not enable social or editorial feature flags during deployment.

## Acceptance

- Release SHA and hosting on the public domain match the verified candidate.
- Admin command center redirects anonymous requests and rejects non-admin users through the shared role check.
- Real aggregates are visible after admin login; no private records appear in HTML before login.
- Failed builds keep the previous service running; timer history shows an actual successful run.
- No credentials in Git, client JavaScript, logs or status output.

## September 23 migration hold

The open Marion County community poll uses Vercel BotID. Public DNS must remain on Vercel until equivalent off-platform protection is configured and authenticated voting is tested. Do not bypass the bot check. The new command center is available on the public site through the existing admin login. Supabase data/auth remains managed until a full export, isolated restore, access-policy tests and authentication/storage parity checks pass. No managed project has been deleted or cancelled.

## Official-source monitoring

repwatchr-record-monitor.timer runs hourly at minute 5 plus up to 60 seconds of jitter. Its read-only Python worker checks six official source indexes, downloads at most 2 MB per page, uses three workers and preserves the last successful inventory on errors. State is private under /var/lib/repwatchr/record-monitor, outside the website. The first baseline and a repeat unchanged run passed. Source changes are leads only; the bounded Codex editorial session must review before publication. No model/API fee or new paid service is involved in discovery.

repwatchr-release.timer checks origin/main hourly at minute 20 plus jitter, skips the serving SHA and runs the full build/check workflow for new releases. Both services were run manually and returned success September 23–24. The desktop heartbeat still depends on desktop availability; neither timer is an autonomous AI author.
