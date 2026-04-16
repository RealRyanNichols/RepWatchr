import type { Metadata } from "next";
import ReportButton from "@/components/shared/ReportButton";

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
