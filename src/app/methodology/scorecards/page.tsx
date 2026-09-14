import type { Metadata } from "next";
import Link from "next/link";
import VectorArt from "@/components/shared/VectorArt";
import { getIssueCategories, getScoreCardGateReport } from "@/lib/data";
import { ISSUE_ART_VIEWBOX, issueArtInnerSvg } from "@/lib/issue-art";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { letterGradeBands } from "@/lib/vote-record-score";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "How the Scorecard Is Calculated | RepWatchr",
  description:
    "The full vote-record scorecard algorithm: how a vote is corroborated, how alignment is weighted, how a category score is produced, the letter scale, and the gate that withholds a scorecard until every vote checks out.",
  path: "/methodology/scorecards",
  imagePath: buildOgImageUrl("methodology", { view: "scorecard-method" }),
  imageAlt: "RepWatchr scorecard algorithm",
});

const steps = [
  {
    number: "01",
    title: "The vote has to exist in a reviewed bill file",
    body: "Before a vote can move anything, the bill it belongs to has to be in the bill record with a public source link, and that file has to show this official casting that exact vote. A vote typed onto a scorecard that the bill file does not corroborate is not scored low. It stops the whole scorecard.",
  },
  {
    number: "02",
    title: "Alignment is computed, never read off the file",
    body: "Each bill carries a declared district position, and the gate refuses any card whose copy of that position disagrees with the reviewed bill. A vote is aligned when the official's recorded vote matches it. The stored `aligned` flag on a row is for display only; the arithmetic re-derives it, so neither a mistyped flag nor a mistyped position can move anyone's score.",
  },
  {
    number: "03",
    title: "An absence is not a wrong vote",
    body: "Only yea and nay are scored here. Absent, abstain, and not-applicable rows are counted and shown, but they are removed from both sides of the division instead of being converted into a zero. Attendance is graded separately, under the performance grade — it is simply not what this number measures.",
  },
  {
    number: "04",
    title: "Every vote carries its own weight, 1 to 10",
    body: "Weight is how much the bill actually decides, set when the bill is reviewed. A weight-10 bill moves a category ten times as far as a weight-1 bill, so a long list of trivial votes cannot bury one that mattered. A row whose weight is missing or outside 1-10 is not quietly repaired to something usable — it withholds the card.",
  },
  {
    number: "05",
    title: "The category score is weighted alignment",
    body: "Add the weights of the aligned votes. Divide by the weight of every vote the official actually cast in that category. That percentage is the category score. A category with no reviewed votes has no score at all, and the page says so rather than printing a zero.",
  },
  {
    number: "06",
    title: "The overall number averages the categories by weight",
    body: "Category scores are averaged using the declared category weights, over the categories that have votes only. Empty categories drop out of both the top and the bottom of the division, so a thin record reads as partial, not bad.",
  },
];

export default function ScorecardMethodPage() {
  const categories = getIssueCategories();
  const gate = getScoreCardGateReport();
  const bands = letterGradeBands();
  const totalCategoryWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Methodology", path: "/methodology" },
    { name: "Scorecard algorithm", path: "/methodology/scorecards" },
  ]);

  return (
    <main className="min-h-screen bg-[#f8fbff] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />

      <section className="overflow-hidden bg-[#061735] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Vote-record scorecard • method v1
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl">
            Show your work, or do not show a grade.
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            Every number on a RepWatchr scorecard is arithmetic over rows printed beneath it on the category page. No
            secret model, no hand-typed grade, no adjustment anyone has to take on faith. This page is the whole
            calculation.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-xs leading-7 text-blue-100 sm:text-sm">
            category score = weight of aligned votes ÷ weight of votes cast × 100
            <br />
            overall = Σ(category score × category weight) ÷ Σ(category weight of scored categories)
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/scorecards" className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-200">
              Open the scorecards
            </Link>
            <Link href="/methodology" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">
              The performance grade is a different number
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <MethodHeading
          eyebrow="Step by step"
          title="Six steps from a roll call to a letter."
          description="Run them in order on any scorecard on this site and you will get the number the page shows."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.number} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">{step.number}</p>
              <h2 className="mt-3 text-xl font-black leading-tight tracking-tight text-slate-950">{step.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="Worked example"
            title="Two votes, and why the weights decide it."
            description="A representative votes with the district on a bill reviewed at weight 10, and against it on a bill reviewed at weight 1."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {["Bill", "District position", "Vote cast", "Weight", "Counts toward"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-semibold text-slate-700">
                  <tr>
                    <td className="px-4 py-3">Eminent domain reform</td>
                    <td className="px-4 py-3">yea</td>
                    <td className="px-4 py-3 text-emerald-700">yea</td>
                    <td className="px-4 py-3 font-mono">10</td>
                    <td className="px-4 py-3 text-emerald-700">aligned · 10</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Appraisal notice deadline</td>
                    <td className="px-4 py-3">yea</td>
                    <td className="px-4 py-3 text-red-700">nay</td>
                    <td className="px-4 py-3 font-mono">1</td>
                    <td className="px-4 py-3 text-red-700">not aligned · 0</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Pipeline easement disclosure</td>
                    <td className="px-4 py-3">yea</td>
                    <td className="px-4 py-3 text-slate-500">absent</td>
                    <td className="px-4 py-3 font-mono text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-500">not scored, shown on the profile</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <aside className="rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">The arithmetic</p>
              <div className="mt-4 rounded-2xl bg-white/5 p-4 font-mono text-xs leading-7 text-blue-100">
                aligned weight = 10
                <br />
                weight cast = 10 + 1 = 11
                <br />
                10 ÷ 11 × 100 = <span className="text-amber-300">91</span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
                Counted as two equal votes it would read 50. The weights are the reason it does not, and every category
                scorecard prints the rows, weights and positions underneath the table so you can redo this sum yourself.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#eef5ff,#f8fbff)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="The five categories"
            title={`Five issues, ${totalCategoryWeight}% of weight between them.`}
            description="These weights are read from the published issue file, not typed onto this page, so the two cannot disagree."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/issues/${category.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-950">
                  <VectorArt
                    inner={issueArtInnerSvg(category.id, category.color)}
                    viewBox={ISSUE_ART_VIEWBOX}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-3xl font-black tracking-[-0.05em]" style={{ color: category.color }}>
                    {category.weight}%
                  </p>
                  <h2 className="mt-1 text-sm font-black text-slate-950 group-hover:text-blue-700">{category.name}</h2>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="Letter scale"
            title="A strict scale, on purpose."
            description="A public official does not get a friendly letter for a barely passing record. 80 reads as a C here. These bands are printed straight out of the grading function."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {bands.map((band) => (
              <div key={band.grade} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-center">
                <p className="bg-slate-950 py-4 text-3xl font-black text-white">{band.grade}</p>
                <p className="px-2 py-3 font-mono text-sm font-black text-slate-700">
                  {band.min === band.max ? band.min : `${band.min}–${band.max}`}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            This scale grades the vote record only. The{" "}
            <Link href="/methodology" className="text-blue-700 underline underline-offset-2">
              performance grade
            </Link>{" "}
            uses the conventional A/B/C/D scale because it measures something else entirely, and community sentiment uses
            a third. They are documented separately because they disagree on purpose.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <MethodHeading
          eyebrow="Publication gate"
          title="What is actually published right now."
          description="An empty scorecard table is not a clean record. It means nothing has cleared this gate yet, and the counts below say so out loud."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <GateStat label="Scorecards on file" value={gate.onFile} caption="drafted from reviewed vote rows" />
          <GateStat label="Published" value={gate.published} caption="every vote corroborated by its bill file" tone="good" />
          <GateStat label="Withheld" value={gate.withheldTotal} caption="not shown anywhere on the site" tone="warn" />
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {[
            {
              label: "Held for source review",
              count: gate.withheld.review_status,
              body: "The source desk has not signed the card off. Nothing further is asserted about its rows: the gate stops here, before any bill record is examined, so a card counted in this row may or may not have corroborated votes.",
            },
            {
              label: "No votes on the card",
              count: gate.withheld.no_votes,
              body: "There is a card but nothing on it. A card with no votes is never published as a zero.",
            },
            {
              label: "No scoreable vote",
              count: gate.withheld.no_scoreable_votes,
              body: "Every row is an absence, an abstention, or not applicable. Nothing there can produce a percentage, so the card is withheld rather than published as a zero that reads like an F.",
            },
            {
              label: "Invalid vote weight",
              count: gate.withheld.invalid_vote_weight,
              body: "A row's weight is missing, not a whole number, or outside 1 to 10. Clamping it would invent a weight the reviewer never set and move the grade, so the card is withheld instead.",
            },
            {
              label: "Duplicate row",
              count: gate.withheld.duplicate_vote_row,
              body: "The same bill appears twice in one category. Both copies would corroborate against the single real roll call and then be counted twice by the weighted mean.",
            },
            {
              label: "Row filed under the wrong issue",
              count: gate.withheld.category_mismatch,
              body: "A row's own category does not match the category it is filed under, so it would score against the wrong issue and change both that issue's number and the overall grade.",
            },
            {
              label: "Vote not corroborated",
              count: gate.withheld.vote_not_corroborated,
              body: "At least one vote on the card does not match the published bill file for that official. One mismatch withholds the entire scorecard, not just the row.",
            },
            {
              label: "Position not corroborated",
              count: gate.withheld.position_not_corroborated,
              body: "The district position on a row does not match the reviewed bill. Alignment is the vote measured against that position, so an uncorroborated position could invert a score exactly as a wrong vote would.",
            },
          ].map((row, index) => (
            <div
              key={row.label}
              className={`grid gap-3 p-5 sm:grid-cols-[5rem_16rem_minmax(0,1fr)] sm:items-center sm:p-6 ${index ? "border-t border-slate-200" : ""}`}
            >
              <p className="font-mono text-3xl font-black tracking-[-0.05em] text-blue-800">{row.count}</p>
              <p className="text-sm font-black text-slate-950">{row.label}</p>
              <p className="text-sm font-semibold leading-6 text-slate-600">{row.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          {gate.votesOnFile} vote rows are drafted across those cards. They are kept in source control so the work is
          reviewable, and they are withheld from every public page until the gate clears. Read an empty table as
          &ldquo;not checked yet,&rdquo; never as an endorsement.
        </p>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="What this number is not"
            title="Three things this score will never be."
            description="Keeping these out is what makes the number worth anything."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <NotCard
              title="Not a party score"
              body="A yea is not scored as morally right and a nay is not scored as morally wrong. The comparison is to a declared district position printed beside the vote, and you can disagree with that position in public on the profile."
            />
            <NotCard
              title="Not the performance grade"
              body="The performance grade measures documented execution of the job — attendance, effectiveness, ethics findings, transparency duties. Policy direction never touches it, and this score never feeds it."
            />
            <NotCard
              title="Not a popularity reading"
              body="Community responses are a self-selected signal shown separately and labeled as such. They are not a poll, not an endorsement, and not an input to any calculation on this page."
            />
          </div>
          <div className="mt-10 rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center">
            <p className="text-sm font-bold leading-6 text-blue-950">
              Found a vote recorded wrong, a weight you would argue with, or a bill with no source link? That is the
              useful kind of fight. Send it and the calculation changes in public.
            </p>
            <Link
              href="/submit-source"
              className="mt-4 inline-flex rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900"
            >
              Submit a source or correction
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MethodHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
      <h2 className="mt-3 max-w-5xl text-3xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">{description}</p>
    </header>
  );
}

function GateStat({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: number;
  caption: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-950",
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warn: "border-amber-200 bg-amber-50 text-amber-950",
  };
  return (
    <article className={`rounded-3xl border p-6 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-5xl font-black tracking-[-0.06em]">{value}</p>
      <p className="mt-3 text-sm font-semibold leading-6 opacity-80">{caption}</p>
    </article>
  );
}

function NotCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
    </article>
  );
}
