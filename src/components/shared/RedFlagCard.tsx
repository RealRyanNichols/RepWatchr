import type { RedFlag } from "@/types";

interface RedFlagCardProps {
  flag: RedFlag;
}

export default function RedFlagCard({ flag }: RedFlagCardProps) {
  const isCritical = flag.severity === "critical";

  return (
    <div
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
        </div>
      </div>
    </div>
  );
}
