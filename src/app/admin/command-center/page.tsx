import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPageAccess } from "@/lib/admin-auth";
import { getCommandCenter } from "@/lib/command-center";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Command Center | RepWatchr", robots: { index: false, follow: false } };
const number = (n: number | null) => n === null ? "Unavailable" : n.toLocaleString("en-US");
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const actions = [
  { step: "01", title: "Own the local record", body: "Keep HD-7 and TX-01 profiles current. Close missing-source and portrait gaps before expanding coverage.", metric: "Measure: profiles with sources and current review dates", href: "/home-district/roster", label: "Open coverage gaps" },
  { step: "02", title: "Publish something useful", body: "Check hourly for meaningful, verified local developments. Put the consequence and source in the headline and article.", metric: "Measure: new articles, article opens and search clicks", href: "/admin/content-review", label: "Open editorial desk" },
  { step: "03", title: "Give each story a route to readers", body: "Promote verified live articles from the owned brand accounts. Tag links by platform and article; keep failed deliveries visible.", metric: "Measure: tagged visits and confirmed post links", href: "/admin/planner", label: "Open social planner" },
  { step: "04", title: "Earn the next visit", body: "Make finding a representative, reading a source and saving a record easy on mobile. Review results weekly before adding more features.", metric: "Measure: source opens, watch actions and new accounts", href: "/admin/quality", label: "Open quality checks" },
];

export default async function CommandCenter({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdminPageAccess();
  const { days } = await searchParams;
  const r = await getCommandCenter(days === "7" ? 7 : 30);
  const t = r.traffic;
  const trafficNumber = (n: number) => r.trafficAvailable ? number(n) : "Unavailable";
  const peak = Math.max(1, ...t.daily.map((d) => d.views));
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">RepWatchr / Owner workspace</p>
          <Link href="/admin" className="rounded-lg border border-slate-600 px-4 py-2 text-sm">All admin tools ↗</Link>
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Command center</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Who is reading. What is publishing. Where the record is growing.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 text-sm">
          {[7, 30].map((d) => <Link key={d} href={`?days=${d}`} aria-current={r.days === d ? "page" : undefined} className={`rounded-lg px-4 py-3 font-bold ${r.days === d ? "bg-amber-300 text-slate-950" : "bg-slate-800 text-white"}`}>{d} days</Link>)}
          <form><input type="hidden" name="days" value={r.days}/><button className="rounded-lg border border-slate-500 px-4 py-3">Refresh data</button></form>
          <span className="text-xs text-slate-400">Updated {new Date(r.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT</span>
        </div>
      </header>
      {r.issues.length > 0 && <aside className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm" role="status"><strong>Some data needs attention.</strong><ul className="mt-2 list-inside list-disc">{r.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></aside>}
      <section aria-label="Key metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Member profiles", number(r.members), `${number(r.newMembers)} created in this window; accounts, not identity verification`],
          ["Recorded page views", trafficNumber(t.views), "Page-view events; recognized bots excluded"],
          ["Recorded clicks & opens", trafficNumber(t.clicks), "Instrumented actions, not every click on the site"],
          ["New articles", number(r.newArticles), `${number(r.articleCount)} in catalog${r.databaseAvailable ? "" : "; database unavailable"}`],
        ].map(([label, value, detail]) => <article key={label} className={card}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 break-words text-4xl font-black">{value}</p><p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p></article>)}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <section className={card}>
          <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-black">Reader activity</h2><span className="text-xs text-slate-500">Daily page views · UTC dates</span></div>
          {r.trafficAvailable ? <><div className="mt-7 flex h-36 items-end gap-1" role="img" aria-label={t.daily.map((d) => `${d.date}: ${d.views} page views`).join("; ")}>
            {t.daily.map((d) => <div key={d.date} title={`${d.date}: ${d.views}`} className="flex h-full min-w-0 flex-1 items-end"><div className="w-full rounded-t bg-blue-700" style={{ height: `${d.views ? Math.max(3, d.views / peak * 100) : 0}%` }}/></div>)}
          </div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{t.daily[0]?.date}</span><span>{t.daily.at(-1)?.date}</span></div>
          <p className="mt-5 text-sm text-slate-600">{number(t.browsers)} browser IDs observed · {number(t.mobileViews)} mobile views · {number(t.articleOpens)} article opens</p></> : <p className="my-8 text-slate-600">Traffic data could not be loaded. No estimate is shown.</p>}
          <p className="mt-3 text-xs leading-5 text-slate-500">{r.sampled ? "Detail is limited to the latest 10,000 recorded events. " : ""}Browser IDs are not unique people. Blocking, missing instrumentation and unrecognized bots can affect counts. Search Console clicks and social impressions are separate metrics.</p>
        </section>
        <section className={card}><h2 className="text-xl font-black">Hosting & operations</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">This request is served by</dt><dd className="mt-1 font-bold">{r.hosting.provider}</dd></div><div><dt className="text-slate-500">Release</dt><dd className="mt-1 font-mono">{r.hosting.release}</dd></div><div><dt className="text-slate-500">Article storage</dt><dd className="mt-1">{r.databaseAvailable ? "Database read succeeded" : "Database unavailable"} · repository catalog</dd></div></dl><p className="mt-5 text-xs leading-5 text-slate-500">Serving from the Droplet does not prove the public domain has moved. Deployment and scheduled-job results are recorded in the server journal. Hourly source discovery runs on the Droplet; researched writing still uses the bounded desktop editorial session.</p></section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[{ title: "Pages people open", rows: t.pages }, { title: "Where recorded visits come from", rows: t.sources }].map((group) => <section key={group.title} className={card}><h2 className="text-xl font-black">{group.title}</h2><ul className="mt-4 divide-y divide-slate-100">{group.rows.map((row) => <li key={row.label} className="flex items-start justify-between gap-4 py-3 text-sm"><span className="min-w-0 break-all">{row.label}</span><strong>{number(row.count)}</strong></li>)}</ul>{!group.rows.length && <p className="mt-4 text-sm text-slate-500">{r.trafficAvailable ? "No recorded page views in this window." : "Data unavailable."}</p>}</section>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={card}><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-black">Publishing desk</h2><Link className="text-sm font-bold text-blue-700" href="/admin/content-review">{number(r.drafts)} database drafts ↗</Link></div><ul className="mt-3 divide-y divide-slate-100">{r.articles.map((a) => <li className="py-4" key={a.slug}><p className="text-xs text-slate-500">{a.published_at.slice(0, 10)}</p><Link href={`/news/${a.slug}`} className="mt-1 block font-bold hover:text-blue-700">{a.title} ↗</Link></li>)}</ul></section>
        <section className={card}><h2 className="text-xl font-black">Social distribution</h2><div className="mt-4 space-y-3 text-sm"><div className="rounded-xl bg-slate-100 p-4"><a href="https://x.com/RepWatchr" className="font-bold text-blue-700">X · @RepWatchr ↗</a><p className="mt-2">Latest manually verified announcement: <a className="underline" href="https://x.com/RepWatchr/status/2102021716310458507">Harrison County article</a>.</p><p className="mt-1 text-xs text-slate-500">Verified September 23, 2026. Manual receipt, not a live platform sync.</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><a href="https://www.facebook.com/RepWatchr" className="font-bold">Facebook · RepWatchr ↗</a><p className="mt-2">Last recorded state: restricted. Captions held; do not retry until the restriction is resolved.</p><p className="mt-1 text-xs text-slate-500">Restriction observed September 20, 2026. Current account status requires a platform check.</p></div></div>
          <h3 className="mt-5 font-bold">Planner queue</h3><p className="mt-1 text-xs text-slate-500">Latest 50 draft/failed records; native platform schedules are separate.</p><ul className="mt-2 divide-y divide-slate-100">{r.queue.slice(0, 5).map((q, i) => <li key={i} className="py-2 text-sm">{q.platform} · {q.editorial_status} · {q.publish_status}{q.scheduled_for ? ` · ${q.scheduled_for.slice(0, 16)} UTC` : " · unscheduled"}</li>)}</ul>{!r.queue.length && <p className="mt-2 text-sm text-slate-500">No queue records returned. Check integration notices above.</p>}
          <h3 className="mt-5 font-bold">Latest delivery records</h3><ul className="mt-2 space-y-2 text-sm">{r.social.slice(0, 4).map((s, i) => <li key={i}><span className="font-bold">{s.platform} · {s.status}</span><p className="text-slate-600">{s.story_title}</p></li>)}</ul><p className="mt-3 text-xs text-slate-500">Delivery states are database records. No live follower, reach or impression feed is connected here.</p><Link className="mt-4 inline-block rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white" href="/admin/planner">Open planner ↗</Link>
        </section>
      </div>
      <section className={`${card} mt-6`}><h2 className="text-xl font-black">The database we are building</h2><div className="mt-5 grid gap-5 sm:grid-cols-3">{[[r.coverage.profiles,"Official records loaded"],[r.coverage.sources,"Public source URLs"],[r.pendingSources,"Source submissions received"]].map(([n, label]) => <div key={String(label)}><strong className="text-3xl">{number(n as number | null)}</strong><p className="mt-1 text-sm text-slate-600">{label}</p></div>)}</div><p className="mt-4 text-xs text-slate-500">Loaded records and attached sources do not mean verified incumbency or complete nationwide coverage.</p><Link href="/admin/control-center" className="mt-4 inline-block text-sm font-bold text-blue-700">Inspect coverage and data health ↗</Link></section>
      <section className="mt-10"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Growth plan</p><h2 className="mt-2 text-3xl font-black">Make the next useful visit easier.</h2><p className="mt-2 text-sm text-slate-600">Operating priorities, not promised results. Use the first 30 days as a baseline; review the same measures each week.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{actions.map((a) => <article key={a.step} className={card}><span className="font-mono text-sm text-blue-700">{a.step}</span><h3 className="mt-2 text-xl font-black">{a.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{a.body}</p><p className="mt-4 text-xs font-bold text-slate-700">{a.metric}</p><Link href={a.href} className="mt-5 inline-block text-sm font-bold text-blue-700">{a.label} ↗</Link></article>)}</div></section>
    </div>
  </main>;
}
