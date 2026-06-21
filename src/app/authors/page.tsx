import type { Metadata } from "next";
import Link from "next/link";
import AuthorMissionBuilder from "@/components/authors/AuthorMissionBuilder";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Citizen Author Desk | RepWatchr",
  description:
    "Become a RepWatchr citizen author. Build source-backed political stories, profile updates, meeting records, source drops, and shareable accountability packets.",
  path: "/authors",
  imagePath: buildOgImageUrl("source-packet"),
  imageAlt: "RepWatchr citizen author desk preview",
});

const authorRoles = [
  {
    role: "Watchdog author",
    job: "Turn one record into a plain-English story people can share.",
  },
  {
    role: "Profile builder",
    job: "Fill missing offices, terms, photos, votes, funding, and source links.",
  },
  {
    role: "Meeting reporter",
    job: "Capture agendas, minutes, clips, votes, and unanswered public questions.",
  },
  {
    role: "Source runner",
    job: "Find the official URL that turns a claim into something voters can inspect.",
  },
  {
    role: "Scorecard reader",
    job: "Connect votes, public positions, and issue scores to the original record.",
  },
  {
    role: "Share editor",
    job: "Write careful snippets that travel without overstating the proof.",
  },
];

const publishSignals = [
  "A named official, office, agency, board, vote, donor, vendor, or public record.",
  "A date, jurisdiction, district, meeting, filing, or source timestamp.",
  "A public URL voters can open without special access.",
  "A short why-it-matters line that does not claim more than the source proves.",
  "Clear separation between confirmed record, allegation, opinion, and missing proof.",
  "No private addresses, minor children, threats, doxxing, or harassment targets.",
];

const storyLoop = [
  {
    label: "Pick a target",
    detail: "Names, votes, boards, agencies, money trails, filings, clips, and public records hold attention better than vague outrage.",
  },
  {
    label: "Attach the receipt",
    detail: "The source link is what lets the story survive screenshots, comments, hostile readers, and election-season pressure.",
  },
  {
    label: "Write the packet",
    detail: "Use a hook, a date, a source line, named public offices, missing questions, and a clear next click.",
  },
  {
    label: "Submit and share",
    detail: "Send the packet for review, claim the profile path, then share the clean link back to RepWatchr.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Citizen Author Desk",
  url: "https://www.repwatchr.com/authors",
  description:
    "A RepWatchr workspace for source-backed citizen authors, profile builders, meeting reporters, source runners, and share editors.",
  isPartOf: {
    "@type": "WebSite",
    name: "RepWatchr",
    url: "https://www.repwatchr.com",
  },
  about: [
    "public officials",
    "public records",
    "citizen journalism",
    "political accountability",
    "school boards",
    "voting records",
  ],
};

export default function AuthorsPage() {
  return (
    <div className="bg-white pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_48%,#fff7ed_100%)]">
        <div className="grid h-2 grid-cols-3">
          <div className="bg-red-700" />
          <div className="bg-white" />
          <div className="bg-blue-900" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                Citizen Author Desk
              </span>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950">
                Source-backed stories
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-950">
                Profile buildouts
              </span>
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-blue-950 sm:text-6xl lg:text-7xl">
              Let the voters become the newsroom.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-blue-950/75 sm:text-lg">
              RepWatchr should not only be a place people read. It should be the
              place they bring the receipt, build the profile, write the source-backed
              story, and send everyone back to the record.
            </p>
          </div>

          <AuthorMissionBuilder />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Contributor flywheel
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
              More authors means more records, more profiles, and more reasons to return.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-blue-950/70">
              The attention loop works when a visitor can move from reader to
              researcher to submitter to author without guessing what to do next.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/feedback"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Submit a source
              </Link>
              <Link
                href="/profiles/claim"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
              >
                Claim a profile
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {storyLoop.map((item, index) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-red-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">
                    {item.label}
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-blue-100 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Author roles
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
              Give people an identity and a job they can finish.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {authorRoles.map((item) => (
              <div key={item.role} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-blue-950">{item.role}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {item.job}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              What gets published fastest
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
              The stronger the receipt, the faster the story can move.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
              RepWatchr can hit hard and still stay clean. Public records,
              official links, timestamps, and careful wording keep the work
              shareable after the first wave of attention.
            </p>
          </div>
          <div className="grid gap-2">
            {publishSignals.map((signal) => (
              <div key={signal} className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-100">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            <Link
              href="/feed"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50"
            >
              <p className="text-xs font-black uppercase tracking-wide text-red-700">
                Read first
              </p>
              <h3 className="mt-2 text-2xl font-black text-blue-950">
                Open the feed
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Study the format: hook, source, linked officials, snippet, and route
                back to the full record.
              </p>
            </Link>
            <Link
              href="/feedback"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50"
            >
              <p className="text-xs font-black uppercase tracking-wide text-red-700">
                Submit next
              </p>
              <h3 className="mt-2 text-2xl font-black text-blue-950">
                Send the receipt
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Drop the agenda, article, filing, clip, vote, roster, correction, or
                source gap for review.
              </p>
            </Link>
            <Link
              href="/create-account"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="text-xs font-black uppercase tracking-wide text-blue-800">
                Return often
              </p>
              <h3 className="mt-2 text-2xl font-black text-blue-950">
                Join the watch
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Build a watchlist, revisit records, and keep improving the public
                profile trail.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
