import Link from "next/link";
import CorrectionRequestButton from "@/components/trust/CorrectionRequestButton";
import SafetyLabel from "@/components/trust/SafetyLabel";

export default function TrustExplainerBox({
  entityType,
  entityId,
  entityName,
  url,
  title = "Source-backed, correction-ready, hostile-read safe.",
  body = "RepWatchr does not publish private addresses, minor-child details, threats, doxxing instructions, or unsourced criminal accusations. If a record is wrong, stale, incomplete, or missing context, request a correction and attach the public source path.",
}: {
  entityType: string;
  entityId: string;
  entityName: string;
  url?: string;
  title?: string;
  body?: string;
}) {
  return (
    <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Trust and correction</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SafetyLabel label="Confirmed public record" />
            <SafetyLabel label="Source-backed claim" />
            <SafetyLabel label="Needs source" />
            <SafetyLabel label="Correction requested" />
            <SafetyLabel label="Under review" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <CorrectionRequestButton
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            url={url}
            buttonClassName="w-full justify-center rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          />
          <Link
            href={`/sources/submit?form=correction_request&targetType=${encodeURIComponent(entityType)}&targetId=${encodeURIComponent(entityId)}&targetName=${encodeURIComponent(entityName)}`}
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
          >
            Submit correction source
          </Link>
        </div>
      </div>
    </section>
  );
}
