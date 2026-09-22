import type { Metadata } from "next";
import Link from "next/link";
import SourceSubmissionForm from "@/components/source-submissions/SourceSubmissionForm";
import ShareButtons from "@/components/shared/ShareButtons";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import PublicContentRulesPanel from "@/components/shared/PublicContentRulesPanel";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { getRosterSourceContext } from "@/lib/roster-source-context";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Submit Source | RepWatchr",
    description:
      "Send RepWatchr a public source, correction, roster, vote, filing, meeting record, or missing official for review.",
    path: "/submit-source",
    imagePath: buildOgImageUrl("source-packet", { view: "feedback" }),
    imageAlt: "RepWatchr source packet preview",
  }),
};

export default async function FeedbackPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] ?? "" : raw ?? "").trim().slice(0, 200);
  };
  const rosterContext = getRosterSourceContext(value("from"));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {rosterContext ? (
        <Link href={rosterContext.href} className="mb-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#163b5c] underline underline-offset-4">
          ← Back to {rosterContext.name} records
        </Link>
      ) : null}
      <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#fff7ed_100%)] shadow-sm">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Source drop
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950">
            {rosterContext ? `Help complete the ${rosterContext.name} record.` : "Put a missing receipt in the record."}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            {rosterContext
              ? "Send a public roster or official office page with its date and the detail it supports. The jurisdiction and record page stay attached for review. Submitting a source does not publish it or confirm who currently holds an office."
              : "Build a source packet for the agenda, clip, filing, roster, article, vote, meeting video, campaign-finance record, correction, or missing official. You do not need an account. Public-source links are what turn concern into a reusable record."}
          </p>
        </div>
      </section>

      {!rosterContext ? <><div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-950">
            Fix the record
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Wrong name, outdated office, broken source, incorrect party, bad term date, score issue, or missing context.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-950">
            Add a target
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            County, city, school board, public board, appointed office, election result, or official roster that RepWatchr has not loaded yet.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-red-800">
          What gets reviewed fastest
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Official source URL", "Date and jurisdiction", "Why voters should look"].map((item) => (
            <div key={item} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-blue-950 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <ShareButtons
          title="Submit a better source to RepWatchr"
          description="Send RepWatchr a correction, public record, filing, vote, agenda, meeting clip, or missing source for review."
          path="/submit-source"
          template="correction_needed"
          subject="RepWatchr source correction form"
          sourceLabel="public record, correction, source URL, or missing official source"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <NextUsefulMove
          recordPath="/dashboard"
          sourcePath="/submit-source"
          packetPath="/free-packet"
          safeShareLine="RepWatchr source submissions work best when the public URL, date, jurisdiction, and exact question stay attached."
          meetingQuestion="What source are we missing, and who is the public custodian for that record?"
        />
        <PublicContentRulesPanel compact />
      </div>

      </> : null}

      <SourceSubmissionForm
        key={[rosterContext?.href, value("target"), value("jurisdiction"), value("type")].join(":")}
        defaultTarget={value("target") || rosterContext?.name}
        defaultJurisdiction={value("jurisdiction") || (rosterContext ? `${rosterContext.name}, Texas` : "")}
        defaultSourceType={rosterContext ? "roster" : "official_record"}
        defaultTargetPageUrl={rosterContext?.href ?? "/submit-source"}
        defaultCheckRequest={rosterContext ? `Check the current officeholder, office or precinct, and source date for ${value("target") || rosterContext.name}.` : ""}
      />

      <div className="mt-10 rounded-xl bg-blue-50/70 border border-blue-100 p-6">
        <h2 className="text-lg font-bold text-blue-950 mb-3">
          What to include
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Official name and office",
            "Jurisdiction, county, district, or seat",
            "Public source URL",
            "Term, election date, or appointment date",
            "What is wrong, missing, or new",
            "No private addresses or minor children",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-black text-blue-950">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl bg-gray-50 border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          What happens after you submit?
        </h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              1
            </span>
            <span>
              Your source enters the private review queue with a submission ID.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <span>
              You get a copyable packet for your own records.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              3
            </span>
            <span>
              A RepWatchr admin checks the source before it is attached to a profile, race, story, or record page.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
