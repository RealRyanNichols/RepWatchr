import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials } from "@/lib/data";
import {
  HOME_DISTRICTS,
  HOME_DISTRICT_COUNTIES,
  TX_CONGRESSIONAL_DISTRICT_1,
  TX_HOUSE_DISTRICT_7,
  coverageTierForOfficial,
  isHomeDistrictSeat,
} from "@/lib/home-districts";
import { HD7_RACE_SLUG } from "@/data/hd7-records";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "HD-7 and TX-01: The RepWatchr Beat",
  description:
    "RepWatchr covers Texas House District 7 and Texas's 1st congressional district first. See the two seats, the counties in scope, and the rule for when Texas and Washington stories run here.",
  path: "/home-district",
  imagePath: buildOgImageUrl("home", { page: "home-district" }),
  imageAlt: "RepWatchr HD-7 and TX-01 coverage beat",
});

const COVERAGE_RULES = [
  {
    tier: "First",
    title: "HD-7 and TX-01",
    detail:
      "Every record inside these two districts is in scope by default: the state representative, the congressman, county judges and commissioners, sheriffs and constables, prosecutors, city councils, school boards, appraisal districts and every other elected local board.",
  },
  {
    tier: "Second",
    title: "The rest of East Texas",
    detail:
      "The wider launch territory around Harleton stays covered, because the same courts, water, roads, hospitals and school money cross district lines.",
  },
  {
    tier: "Third",
    title: "Texas, when it reaches the district",
    detail:
      "A statewide bill, budget line, court ruling, agency action or election runs here when it changes what HD-7 and TX-01 residents pay, receive, vote on or answer to.",
  },
  {
    tier: "Fourth",
    title: "Washington, on the same test",
    detail:
      "Federal votes, hearings, spending and oversight run here when TX-01's seat is in them, or when the decision is big enough that people in these counties need it either way.",
  },
];

export default function HomeDistrictBeatPage() {
  const officials = getAllOfficials();
  const inHomeDistricts = officials.filter((official) => coverageTierForOfficial(official) === "home-district");
  const seats = officials.filter(isHomeDistrictSeat);
  const levelCounts = new Map<string, number>();
  inHomeDistricts.forEach((official) => {
    levelCounts.set(official.level, (levelCounts.get(official.level) ?? 0) + 1);
  });
  const levelRows = [...levelCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="bg-[#f5f1e8] text-[#111b24]">
      <section className="border-b border-[#cabfae] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold text-[#a23a2b]">The beat</p>
          <h1 className="mt-5 max-w-4xl font-[Fraunces] text-5xl font-semibold leading-[.94] sm:text-7xl">
            HD-7 for the state. TX-01 for the federal.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700">
            RepWatchr is not a national desk that occasionally looks at Texas. It is an East Texas desk with two
            districts at the center of it. Texas and Washington stories run here when they reach these districts, or
            when they are big enough that people in these counties need them anyway.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href={`/elections/texas/${HD7_RACE_SLUG}`}
              className="min-h-11 border border-[#111b24] px-5 py-3 hover:bg-[#111b24] hover:text-white"
            >
              Open the HD-7 record desk
            </Link>
            <Link
              href="/home-district/roster"
              className="min-h-11 border border-[#111b24] px-5 py-3 hover:bg-[#111b24] hover:text-white"
            >
              Every seat and every gap
            </Link>
            <Link
              href="/east-texas"
              className="min-h-11 border border-[#111b24] px-5 py-3 hover:bg-[#111b24] hover:text-white"
            >
              East Texas accountability desk
            </Link>
            <Link
              href="/submit-source"
              className="min-h-11 border border-[#a23a2b] bg-[#a23a2b] px-5 py-3 text-white hover:bg-[#8b3024]"
            >
              Submit a source
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-px border-y border-[#cabfae] bg-[#cabfae] md:grid-cols-3">
          {[
            ["Counties in the two districts", HOME_DISTRICT_COUNTIES.length],
            ["Profiles matched to the districts", inHomeDistricts.length],
            ["Home seats tracked directly", seats.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#f5f1e8] px-5 py-7">
              <p className="font-[Fraunces] text-4xl font-semibold">{Number(value).toLocaleString()}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {HOME_DISTRICTS.map((district) => (
            <article key={district.id} className="border border-[#cabfae] bg-white p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-[#a23a2b]">
                {district.code} · {district.level === "state" ? "State" : "Federal"}
              </p>
              <h2 className="mt-2 font-[Fraunces] text-3xl font-semibold">{district.label}</h2>
              <p className="mt-3 leading-7 text-slate-700">{district.summary}</p>

              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="font-bold uppercase tracking-wide text-slate-500">Current officeholder</dt>
                  <dd className="mt-1">
                    <Link href={district.seatHref} className="font-semibold underline underline-offset-4">
                      {district.incumbentName}
                    </Link>
                    <span className="text-slate-600"> · {district.chamber}</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-wide text-slate-500">Counties</dt>
                  <dd className="mt-1 leading-6 text-slate-700">
                    {district.counties
                      .map((county) => (county.inclusion === "partial" ? `${county.name} (part)` : county.name))
                      .join(", ")}
                  </dd>
                </div>
                {district.raceHref ? (
                  <div>
                    <dt className="font-bold uppercase tracking-wide text-slate-500">Race desk</dt>
                    <dd className="mt-1">
                      <Link href={district.raceHref} className="font-semibold underline underline-offset-4">
                        Open the 2026 record desk
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div
                className={`mt-6 border-l-4 p-4 text-sm leading-6 ${
                  district.boundaryStatus === "verified"
                    ? "border-[#2f6b4f] bg-[#eef5f0]"
                    : "border-[#a23a2b] bg-[#f7ece9]"
                }`}
              >
                <p className="font-bold uppercase tracking-wide">
                  {district.boundaryStatus === "verified" ? "Boundary: sourced" : "Boundary: needs authentication"}
                </p>
                <p className="mt-2 text-slate-700">{district.boundaryNote}</p>
                <p className="mt-2 text-slate-600">Reviewed {district.boundaryReviewedAt}.</p>
              </div>

              <ul className="mt-6 space-y-2 text-sm">
                {district.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline underline-offset-4"
                    >
                      {source.label}
                    </a>
                    <span className="text-slate-600"> · supports {source.supports.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="font-[Fraunces] text-4xl font-semibold">What runs here, and why</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Coverage is ordered, not unlimited. Anything further out has to earn its place by reaching the district.
          </p>
          <div className="mt-8 divide-y divide-[#cabfae] border-y border-[#cabfae]">
            {COVERAGE_RULES.map((rule) => (
              <div key={rule.title} className="grid gap-3 py-6 sm:grid-cols-[8rem_1fr]">
                <p className="font-[Fraunces] text-2xl font-semibold text-[#a23a2b]">{rule.tier}</p>
                <div>
                  <p className="font-[Fraunces] text-2xl font-semibold">{rule.title}</p>
                  <p className="mt-2 leading-7 text-slate-700">{rule.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {levelRows.length ? (
          <section className="mt-16">
            <h2 className="font-[Fraunces] text-4xl font-semibold">Profiles already matched to the districts</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-700">
              Counts by office level. A count is coverage started, not coverage finished. The buildout ledger on the
              East Texas desk shows which of these are still thin.
            </p>
            <div className="mt-8 grid gap-px border-y border-[#cabfae] bg-[#cabfae] sm:grid-cols-2 lg:grid-cols-3">
              {levelRows.map(([level, count]) => (
                <div key={level} className="bg-[#f5f1e8] px-5 py-6">
                  <p className="font-[Fraunces] text-3xl font-semibold">{count.toLocaleString()}</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-700">{level.replace(/-/g, " ")}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 border border-[#cabfae] bg-white p-7">
          <h2 className="font-[Fraunces] text-3xl font-semibold">Missing an office in HD-7 or TX-01?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            {TX_HOUSE_DISTRICT_7.code} is {TX_HOUSE_DISTRICT_7.counties.length} counties.{" "}
            {TX_CONGRESSIONAL_DISTRICT_1.code} is {TX_CONGRESSIONAL_DISTRICT_1.counties.length}. Every elected seat
            inside them belongs on this site. If one is missing, send the roster, the agenda, the filing or the link and
            it goes into the queue with its source attached.
          </p>
          <Link
            href="/submit-source"
            className="mt-5 inline-block min-h-11 border border-[#a23a2b] bg-[#a23a2b] px-5 py-3 font-semibold text-white hover:bg-[#8b3024]"
          >
            Send the record
          </Link>
        </section>
      </section>
    </main>
  );
}
