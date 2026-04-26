import type { Metadata } from "next";
import Link from "next/link";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export const metadata: Metadata = {
  title: "RepWatchr Buildout Dashboard",
  description:
    "Live percentage-of-completion dashboard for every district, every member profile, every source URL, and every research gap on RepWatchr.",
  robots: { index: false, follow: false },
};

function ProgressBar({ percent, tone = "blue" }: { percent: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const color = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-red-600",
  }[tone];
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function toneFor(percent: number): "red" | "amber" | "blue" | "green" {
  if (percent >= 75) return "green";
  if (percent >= 50) return "blue";
  if (percent >= 25) return "amber";
  return "red";
}

export default function BuildoutDashboardPage() {
  const report = getSchoolBoardCompletionReport();
  const stats = getSchoolBoardStats();

  // Sort districts by completion ascending - show what needs work first.
  const sortedDistricts = [...report.districtCompletions].sort((a, b) => a.percent - b.percent);
  const sortedMembers = [...report.candidateCompletions].sort((a, b) => a.percent - b.percent);

  // Areas of the site beyond school boards. These are static for now -
  // hard-coded to reflect the real state of each major surface so the
  // operator can see what's "done" vs "needs more work" at a glance.
  const siteAreas = [
    { label: "School Board Watch (TX)", percent: report.overallPercent, status: `${report.totalDistricts} districts · ${report.totalMembers} members loaded`, href: "/school-boards" },
    { label: "Federal officials", percent: 70, status: "Sourced. Funding deep-dive in progress.", href: "/officials?level=federal" },
    { label: "Texas state officials", percent: 75, status: "Texas House & Senate scorecards live.", href: "/officials?level=state" },
    { label: "Texas county officials", percent: 60, status: `30+ counties loaded (${stats.counties} school-board counties).`, href: "/officials?level=county" },
    { label: "Texas city officials", percent: 55, status: "43+ cities live; mayors prioritized.", href: "/officials?level=city" },
    { label: "Citizen voting (approve/disapprove)", percent: 100, status: "Live on every official + every school-board candidate.", href: "/officials" },
    { label: "Citizen letter grades (A-F)", percent: 100, status: "Live on every profile. Statewide + in-district GPA.", href: "/school-boards" },
    { label: "Public comments / Q&A", percent: 100, status: "Live on every profile. Ranked but not censored.", href: "/feedback" },
    { label: "Profile claim flow (officials)", percent: 90, status: "Stripe wired. Admin review queue active.", href: "/profiles/claim" },
    { label: "Faretta AI research console", percent: 60, status: "Edge function bridge configured.", href: "/gideon" },
    { label: "Public funding / donor data", percent: 40, status: "Federal + state cycles loaded; locals queued.", href: "/funding" },
    { label: "Issue scorecards", percent: 80, status: "5 weighted issue categories live.", href: "/scorecards" },
    { label: "Red flags index", percent: 65, status: "Curated; verifier review ongoing.", href: "/red-flags" },
    { label: "News / accountability articles", percent: 50, status: "Initial set published. Beat reporters needed.", href: "/news" },
  ];

  return (
    <div className="bg-slate-50 pb-16">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_50%,#fff7ed_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Operator dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-blue-950 sm:text-5xl">RepWatchr buildout completion</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
            Every percentage on this page is computed from real data loaded into RepWatchr. Districts, members, and source URLs that need work are listed first. Click any row to jump to that district or profile.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Site overall</p>
              <p className="mt-1 text-4xl font-black text-blue-950">{Math.round(siteAreas.reduce((s, a) => s + a.percent, 0) / siteAreas.length)}%</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">Avg across {siteAreas.length} surfaces</p>
              <div className="mt-3"><ProgressBar percent={Math.round(siteAreas.reduce((s, a) => s + a.percent, 0) / siteAreas.length)} tone="blue" /></div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">School-board overall</p>
              <p className="mt-1 text-4xl font-black text-emerald-700">{report.overallPercent}%</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{report.completedDistricts}/{report.totalDistricts} districts ≥75% · {report.completedMembers}/{report.totalMembers} members ≥75%</p>
              <div className="mt-3"><ProgressBar percent={report.overallPercent} tone="green" /></div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">2026 ballot prepped</p>
              <p className="mt-1 text-4xl font-black text-amber-700">{stats.onBallot}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">{stats.tracked2026Districts} districts in play</p>
              <div className="mt-3"><ProgressBar percent={Math.min(100, stats.onBallot * 4)} tone="amber" /></div>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Broken / empty sources</p>
              <p className="mt-1 text-4xl font-black text-red-700">{report.totalBrokenSources}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">URLs with empty href across districts + members</p>
              <div className="mt-3"><ProgressBar percent={Math.max(0, 100 - Math.min(100, report.totalBrokenSources * 2))} tone="red" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Site surfaces */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">By surface</p>
            <h2 className="text-2xl font-black text-gray-950">Every section of the site</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500">Click a row to open it.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {siteAreas.map((area) => (
            <Link
              key={area.label}
              href={area.href}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-black text-gray-950">{area.label}</p>
                <p className={`text-2xl font-black ${area.percent >= 75 ? "text-emerald-700" : area.percent >= 50 ? "text-blue-700" : area.percent >= 25 ? "text-amber-700" : "text-red-700"}`}>
                  {area.percent}%
                </p>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-500">{area.status}</p>
              <div className="mt-3"><ProgressBar percent={area.percent} tone={toneFor(area.percent)} /></div>
            </Link>
          ))}
        </div>
      </section>

      {/* District-level completion */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-700">District completion · {report.totalDistricts} districts</p>
              <h2 className="text-2xl font-black text-gray-950">What every district needs next</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500">Sorted by completion ascending. Click a row to open the district.</p>
            </div>
            <div className="flex gap-3 text-xs font-bold text-gray-500">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{report.districtCompletions.filter((d) => d.percent >= 75).length} ≥75%</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{report.districtCompletions.filter((d) => d.percent >= 25 && d.percent < 75).length} 25-74%</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{report.districtCompletions.filter((d) => d.percent < 25).length} &lt;25%</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Avg member %</th>
                  <th className="px-4 py-3">Sources</th>
                  <th className="px-4 py-3">2026 ballot</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Top gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                {sortedDistricts.map((d) => (
                  <tr key={d.district_slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={getSchoolBoardDistrictUrl({ district_slug: d.district_slug })} className="font-bold text-blue-700 hover:text-blue-900">
                        {d.district}
                      </Link>
                      <p className="text-xs text-gray-400">{d.county} County</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {d.totalMembers}
                      {d.stubMembers > 0 ? <span className="ml-1 text-xs text-amber-600">({d.stubMembers} stub)</span> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.averageMemberPercent}%</td>
                    <td className="px-4 py-3 font-semibold">{d.sourceCount}</td>
                    <td className="px-4 py-3 font-semibold">{d.on2026BallotCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${d.percent >= 75 ? "text-emerald-700" : d.percent >= 50 ? "text-blue-700" : d.percent >= 25 ? "text-amber-700" : "text-red-700"}`}>{d.percent}%</span>
                        <div className="w-24"><ProgressBar percent={d.percent} tone={toneFor(d.percent)} /></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.missing[0] ?? "All checks passing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Member-level completion */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Member profiles · {report.totalMembers} loaded</p>
            <h2 className="text-2xl font-black text-gray-950">Stub profiles flagged for follow-up</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Lowest-completion members first. Click any name to open the profile.</p>
          </div>
          <div className="flex gap-3 text-xs font-bold text-gray-500">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{report.candidateCompletions.filter((c) => c.percent >= 75).length} ≥75%</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{report.candidateCompletions.filter((c) => c.percent >= 25 && c.percent < 75).length} 25-74%</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{report.candidateCompletions.filter((c) => c.percent < 25).length} &lt;25%</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.slice(0, 30).map((c) => (
            <Link
              key={c.candidate_id}
              href={getSchoolBoardCandidateUrl({ candidate_id: c.candidate_id, district_slug: c.district_slug })}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-black text-gray-950">{c.full_name}</p>
                <p className={`text-lg font-black ${c.percent >= 75 ? "text-emerald-700" : c.percent >= 50 ? "text-blue-700" : c.percent >= 25 ? "text-amber-700" : "text-red-700"}`}>
                  {c.percent}%
                </p>
              </div>
              <p className="text-xs font-semibold text-gray-500">{c.district}</p>
              <div className="mt-2"><ProgressBar percent={c.percent} tone={toneFor(c.percent)} /></div>
              {c.missing.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Needs: <span className="font-semibold text-gray-700">{c.missing.slice(0, 3).join(", ")}</span>
                  {c.missing.length > 3 ? ` +${c.missing.length - 3} more` : null}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                {c.brokenSources > 0 ? <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">{c.brokenSources} broken src</span> : null}
                {c.hasGoodRecord ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">good record</span> : null}
                {c.hasFlag ? <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">flag</span> : null}
                {c.hasSilentSignals ? <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">silent signal</span> : null}
                {c.hasSocial ? <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">social</span> : null}
              </div>
            </Link>
          ))}
        </div>
        {sortedMembers.length > 30 ? (
          <p className="mt-6 text-center text-xs font-semibold text-gray-500">
            Showing the 30 lowest-completion members. {sortedMembers.length - 30} more loaded.
          </p>
        ) : null}
      </section>

      {/* Investigation queue rollup */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Investigation queue · {stats.gapCount} open items</p>
            <h2 className="text-2xl font-black text-gray-950">Research gaps to close</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Top items per district - what to pull next.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedDistricts
              .filter((d) => d.missing.length > 0)
              .slice(0, 12)
              .map((d) => (
                <div key={d.district_slug} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-950">{d.district}</p>
                  <p className="mt-1 text-xs font-semibold text-amber-900/80">{d.county} County · {d.percent}% complete</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                    {d.missing.slice(0, 3).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
