import type { Metadata } from "next";
import ReportButton from "@/components/shared/ReportButton";
import { REPWATCHR_PHONE_DISPLAY, REPWATCHR_PHONE_E164 } from "@/lib/repwatchr-contact";

export const metadata: Metadata = {
  title: "Submit Feedback",
  description: "Report incorrect information or submit feedback to the RepWatchr team.",
};

export default function FeedbackPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Report Incorrect Information
      </h1>
      <p className="text-gray-500 mb-8">
        See something wrong? Wrong name, outdated info, incorrect scores? Let
        us know and we&apos;ll fix it. You don&apos;t need an account to submit
        a report.
      </p>
      <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-black uppercase tracking-wide text-blue-900">Call or text RepWatchr</p>
        <p className="mt-1 text-lg font-black text-slate-950">{REPWATCHR_PHONE_DISPLAY}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href={`tel:${REPWATCHR_PHONE_E164}`} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-black text-white hover:bg-red-700">
            Call
          </a>
          <a href={`sms:${REPWATCHR_PHONE_E164}`} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-950 hover:border-red-300 hover:text-red-700">
            Text
          </a>
        </div>
      </div>

      <ReportButton pageUrl="/feedback" />

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
              Your report goes directly to the RepWatchr team for review.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <span>
              We verify the correction against public records and official
              sources.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              3
            </span>
            <span>
              Once confirmed, the data is updated on the site -- usually within
              24-48 hours.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
