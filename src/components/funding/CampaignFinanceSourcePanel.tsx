import type { Official } from "@/types";
import { getCampaignFinanceSourcePath } from "@/lib/campaign-finance-sources";

export default function CampaignFinanceSourcePanel({ official }: { official: Official }) {
  const sourcePath = getCampaignFinanceSourcePath(official);

  return (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-800">
            Campaign funding
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            Money trail source path
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-amber-950">
            {sourcePath.summary}
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">
          source review
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">
            What needs to be loaded
          </p>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-gray-700">
            {sourcePath.reviewItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">
            Open source trail
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourcePath.sources.map((source) => (
              <a
                key={`${source.title}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-900 transition hover:bg-white"
              >
                {source.title}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-gray-600">
            Totals are not shown until the filer and cycle are matched. That keeps missing finance data from reading like
            zero dollars or a clean bill of health.
          </p>
        </div>
      </div>
    </section>
  );
}
