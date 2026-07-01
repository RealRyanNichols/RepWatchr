import Link from "next/link";
import { getRepWatchrFeedbackMechanisms } from "@/data/repwatchr-data-products";

export default function VerifiedPoliticalFeedbackPanel({
  officialId,
  officialName,
  state,
  counties,
}: {
  officialId: string;
  officialName: string;
  state?: string;
  counties: string[];
}) {
  const mechanisms = getRepWatchrFeedbackMechanisms().slice(0, 4);
  const geography = [state, counties[0]].filter(Boolean).join(" / ");

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Verified citizen pulse
          </p>
          <h2 className="mt-2 text-xl font-black leading-tight text-blue-950">
            Vote on the record before election season.
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900 shadow-sm">
          {geography || "Public"}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
        RepWatchr should separate constituent, in-state, out-of-district, and national feedback so one noisy
        group cannot dictate the public signal for {officialName}.
      </p>

      <div className="mt-4 grid gap-2">
        {mechanisms.map((mechanism) => (
          <div key={mechanism.name} className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-red-700">
              {mechanism.name}
            </p>
            <p className="mt-1 text-sm font-black leading-5 text-blue-950">
              {mechanism.question}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 text-[11px] font-black uppercase tracking-wide sm:grid-cols-2">
        {["Verified account", "Constituent label", "One active answer", "Consent tracked"].map((label) => (
          <div key={label} className="rounded-lg bg-white px-3 py-2 text-blue-950 shadow-sm">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/auth/signup?next=${encodeURIComponent(`/officials/${officialId}`)}`}
          className="rounded-xl bg-red-700 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950"
        >
          Create verified account
        </Link>
        <Link
          href="/data-reports"
          className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300"
        >
          Data methodology
        </Link>
      </div>
    </section>
  );
}
