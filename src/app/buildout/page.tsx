import type { Metadata } from "next";
import Link from "next/link";
import {
  getSchoolBoardCompletionReport,
  getSchoolBoardStats,
} from "@/lib/school-board-research";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export const metadata: Metadata = {
  title: "RepWatchr Buildout Dashboard",
  description:
    "Computed buildout dashboard for loaded profile files, roster dossiers, source URLs, public-record gaps, and analytics events on RepWatchr.",
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

function formatCount(value: number) {
  return value.toLocaleString();
}

export default function BuildoutDashboardPage() {
  const report = getSchoolBoardCompletionReport();
  const stats = getSchoolBoardStats();
  const dataStats = getRepWatchrDataStats();

  const visibleProfiles = dataStats.nonSchoolOfficialFiles + stats.candidates;
  const sourceUrls = dataStats.publicSourceUrls + stats.sourceCount;
  const openWork = stats.gapCount + report.totalBrokenSources;

  const sortedDistricts = [...report.districtCompletions].sort((a, b) => a.percent - b.percent).slice(0, 24);
  const sortedMembers = [...report.candidateCompletions].sort((a, b) => a.percent - b.percent).slice(0, 30);

  const inventoryRows = [
    {
      label: "Non-school official files",
      value: dataStats.nonSchoolOfficialFiles,
      detail: `${dataStats.levelCounts.federal} federal, ${dataStats.levelCounts.state} state, ${dataStats.levelCounts.county} county, ${dataStats.levelCounts.city} city records loaded from src/data/officials.`,
      href: "/officials",
    },
    {
      label: "School-board roster dossiers",
      value: stats.candidates,
      detail: `${stats.districts} Texas districts, ${stats.districtsWithRosters} official rosters, ${stats.completedDossiers} non-stub dossiers.`,
      href: "/school-boards",
    },
    {
      label: "Public source URLs",
      value: sourceUrls,
      detail: `${stats.sourceCount} school-board source URLs plus ${dataStats.publicSourceUrls} official, funding, vote, red-flag, or news URLs.`,
      href: "/methodology",
    },
    {
      label: "Scorecard files",
      value: dataStats.scoreCards,
      detail: `${dataStats.issueCategories} issue categories and ${dataStats.bills} bill or vote files are loaded.`,
      href: "/scorecards",
    },
    {
      label: "Funding summaries",
      value: dataStats.fundingSummaries,
      detail: "Funding cards render only when a funding JSON file exists for that official.",
      href: "/funding",
    },
    {
      label: "Red-flag records",
      value: dataStats.redFlagItems,
      detail: `${dataStats.officialsWithRedFlags} officials have one or more sourced red-flag records.`,
      href: "/red-flags",
    },
    {
      label: "News articles",
      value: dataStats.newsArticles,
      detail: `${dataStats.featuredNewsArticles} featured articles are marked for homepage or news emphasis.`,
      href: "/news",
    },
    {
      label: "Open research work",
      value: openWork,
      detail: `${stats.gapCount} candidate research gaps plus ${report.totalBrokenSources} empty source URLs.`,
      href: "/school-boards",
    },
  ];

  const analyticsRows = [
    {
      label: "Vercel event analytics",
      value: "3 events",
      detail: "share_click, picker_drilldown, and profile_open are emitted from visible user actions.",
    },
    {
      label: "Faretta AI collection",
      value: "4 kinds",
      detail: "search, chat, research_note, and prompt_button can be stored through /api/faretta/collect.",
    },
    {
      label: "Live engagement reads",
      value: "4 reads",
      detail: "approval_ratings, citizen_grade_summary, comments, and citizen_votes power the live School Board counter.",
    },
    {
      label: "Member workspace tables",
      value: "3 tables",
      detail: "member_tracked_items, member_profiles, and profile_claims feed the logged-in dashboard and claim flow.",
    },
  ];

  return (
    <div className="bg-slate-50 pb-16">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_50%,#fff7ed_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Operator dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-blue-950 sm:text-5xl">RepWatchr buildout numbers</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
            These are the counts the app is actually loading or querying today. No sales totals. No inflated claims. The open work rows show what still needs records, sources, or profile depth.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/superadmin"
              className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
            >
              Open SuperAdmin office
            </Link>
            <Link
              href="/school-boards"
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-950 hover:border-red-200 hover:text-red-700"
            >
              School board surface
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Visible profiles</p>
              <p className="mt-1 text-4xl font-black text-blue-950">{formatCount(visibleProfiles)}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                {dataStats.nonSchoolOfficialFiles} non-school officials plus {stats.candidates} school-board dossiers.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">School-board completion</p>
              <p className="mt-1 text-4xl font-black text-emerald-700">{report.overallPercent}%</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                {report.completedDistricts}/{report.totalDistricts} districts and {report.completedMembers}/{report.totalMembers} members at 75% or better.
              </p>
              <div className="mt-3">
                <ProgressBar percent={report.overallPercent} tone="green" />
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">Source URLs</p>
              <p className="mt-1 text-4xl font-black text-amber-700">{formatCount(sourceUrls)}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                {stats.sourceCount} school-board plus {dataStats.publicSourceUrls} official data URLs.
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Open work</p>
              <p className="mt-1 text-4xl font-black text-red-700">{formatCount(openWork)}</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                {stats.gapCount} research gaps plus {report.totalBrokenSources} empty source URLs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Data inventory</p>
            <h2 className="text-2xl font-black text-gray-950">What the site is actually pulling</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500">Click a row to open it.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {inventoryRows.map((area) => (
            <Link
              key={area.label}
              href={area.href}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-black text-gray-950">{area.label}</p>
                <p className="text-2xl font-black text-blue-950">{formatCount(area.value)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-500">{area.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Analytics map</p>
            <h2 className="text-2xl font-black text-gray-950">What user actions are actually tracked</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">These are event and table sources wired into the app today.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {analyticsRows.map((item) => (
              <div key={item.label} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-blue-950">{item.value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{item.label}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-wide text-red-700">District completion</p>
            <h2 className="text-2xl font-black text-gray-950">Districts that need the most work</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Lowest completion districts are listed first.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-black uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Sources</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3">Top gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                {sortedDistricts.map((district) => (
                  <tr key={district.district_slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={getSchoolBoardDistrictUrl({ district_slug: district.district_slug })} className="font-bold text-blue-700 hover:text-blue-900">
                        {district.district}
                      </Link>
                      <p className="text-xs text-gray-400">{district.county} County</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{district.totalMembers}</td>
                    <td className="px-4 py-3 font-semibold">{district.sourceCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-950">{district.percent}%</span>
                        <div className="w-24">
                          <ProgressBar percent={district.percent} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{district.missing[0] ?? "All checks passing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Member completion</p>
          <h2 className="text-2xl font-black text-gray-950">Profiles that need follow-up</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">The first 30 lowest-completion member profiles are shown.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortedMembers.map((member) => (
            <Link
              key={member.candidate_id}
              href={getSchoolBoardCandidateUrl({ candidate_id: member.candidate_id, district_slug: member.district_slug })}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-black text-gray-950">{member.full_name}</p>
                <p className="text-lg font-black text-blue-950">{member.percent}%</p>
              </div>
              <p className="text-xs font-semibold text-gray-500">{member.district}</p>
              <div className="mt-2">
                <ProgressBar percent={member.percent} />
              </div>
              {member.missing.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Needs: <span className="font-semibold text-gray-700">{member.missing.slice(0, 3).join(", ")}</span>
                  {member.missing.length > 3 ? ` plus ${member.missing.length - 3} more` : null}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
