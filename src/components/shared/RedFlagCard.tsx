import type { RedFlag } from "@/types";
import ShareButtons from "@/components/shared/ShareButtons";
import ReportButton from "@/components/shared/ReportButton";
import TrustLabel from "@/components/shared/TrustLabel";
import { labelForSource, validateRedFlagForPublicUse } from "@/lib/trust-safety";

interface RedFlagCardProps {
  flag: RedFlag;
  officialName?: string;
  sharePath?: string;
  jurisdiction?: string;
}

export default function RedFlagCard({ flag, officialName, sharePath, jurisdiction }: RedFlagCardProps) {
  const isCritical = flag.severity === "critical";
  const shareSubject = officialName ? `${officialName}: ${flag.title}` : flag.title;
  const publicPath = sharePath || `/red-flags?flag=${encodeURIComponent(flag.id)}#red-flag-${flag.id}`;
  const effectiveJurisdiction = flag.jurisdiction || jurisdiction || "Jurisdiction review pending";
  const statusLabel = labelForSource(flag.sourceUrl, flag.statusLabel);
  const reviewerLabel = flag.reviewerStatus === "reviewed" || flag.reviewerStatus === "attached_to_profile"
    ? "source_backed_claim"
    : "under_review";
  const missingPublicFields = validateRedFlagForPublicUse({
    ...flag,
    jurisdiction: effectiveJurisdiction,
    statusLabel: statusLabel.id,
    reviewerStatus: flag.reviewerStatus || reviewerLabel,
  });

  return (
    <div
      id={`red-flag-${flag.id}`}
      className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${
        isCritical ? "border-l-red-500" : "border-l-amber-500"
      }`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            isCritical ? "text-red-500" : "text-amber-500"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                isCritical
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {flag.severity}
            </span>
            <TrustLabel id={statusLabel.id} />
            <TrustLabel id={reviewerLabel} />
            <h4 className="text-sm font-bold text-gray-900">
              {flag.title}
            </h4>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {flag.description}
          </p>

          <div className="mt-3 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Why It Matters
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {flag.whyItMatters}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="font-semibold text-gray-500">{effectiveJurisdiction}</span>
            <span>
              {new Date(flag.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {flag.sourceUrl && (
              <a
                href={flag.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline"
              >
                View Source
              </a>
            )}
          </div>

          {missingPublicFields.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
              Source review needed before this item is treated as complete: {missingPublicFields.join(", ")}.
            </div>
          ) : null}

          <div className="mt-4 border-t border-gray-100 pt-4">
            <ShareButtons
              title={`${flag.title} | RepWatchr`}
              description={flag.description}
              path={publicPath}
              template="red_flag"
              subject={shareSubject}
              sourceLabel={flag.sourceUrl ? "linked public source" : "source needed"}
            />
            <div className="mt-3">
              <ReportButton
                officialId={flag.officialId}
                pageUrl={publicPath}
                targetLabel={officialName ? `${officialName}: ${flag.title}` : flag.title}
                jurisdiction={effectiveJurisdiction}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
