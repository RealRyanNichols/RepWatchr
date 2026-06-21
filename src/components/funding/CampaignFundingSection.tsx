import type { FundingSummary } from "@/types";
import FundingOverview from "@/components/funding/FundingOverview";
import DonorBreakdownChart from "@/components/funding/DonorBreakdownChart";
import GeographicBreakdown from "@/components/funding/GeographicBreakdown";
import TopDonorsList from "@/components/funding/TopDonorsList";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export default function CampaignFundingSection({
  funding,
}: {
  funding: FundingSummary;
}) {
  const burnRate = pct(funding.totalSpent, funding.totalRaised);
  const cashShare = pct(funding.cashOnHand, funding.totalRaised);
  const topDonorTotal = funding.topDonors.reduce((total, donor) => total + donor.totalAmount, 0);
  const topDonorShare = pct(topDonorTotal, funding.totalRaised);
  const donorFlags = [
    {
      label: "PAC / committee share",
      value: formatPercent(funding.donorBreakdown.pac),
      note: "Shows how much of the coded funding mix is committee-driven.",
    },
    {
      label: "Large-dollar share",
      value: formatPercent(funding.donorBreakdown.largeDollar),
      note: "Separates large-dollar money from small-dollar grassroots support.",
    },
    {
      label: "Out-of-state geography",
      value: formatPercent(funding.geographicBreakdown.outOfState),
      note: "Shows whether money is mostly local/statewide or imported.",
    },
    {
      label: "Top donor concentration",
      value: formatPercent(topDonorShare),
      note: `${formatCurrency(topDonorTotal)} from listed donor/source aggregates in this funding file.`,
    },
  ];

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            Campaign funding
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-950">
            Money trail snapshot
          </h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-gray-600">
            Totals, donor source mix, donor size, geography, sectors, and top donor aggregates are shown together so the funding record can be checked against the source file.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm">
          Cycle {funding.cycle} | Updated {funding.lastUpdated}
        </div>
      </div>

      <FundingOverview funding={funding} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FundingMetric label="Burn rate" value={formatPercent(burnRate)} detail="spent vs raised" />
        <FundingMetric label="Cash reserve" value={formatPercent(cashShare)} detail="cash vs raised" />
        <FundingMetric label="Large-dollar share" value={formatPercent(funding.donorBreakdown.largeDollar)} detail="coded donor-size mix" />
        <FundingMetric label="Out-of-state share" value={formatPercent(funding.geographicBreakdown.outOfState)} detail="coded geography" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <DonorBreakdownChart breakdown={funding.donorBreakdown} />
        <GeographicBreakdown breakdown={funding.geographicBreakdown} />
      </div>

      {funding.industrySectors.length > 0 ? (
        <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Sector / Occupation Aggregates</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {funding.industrySectors.map((sector) => (
              <div key={sector.sector}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-gray-700">
                  <span>{sector.sector}</span>
                  <span>{formatCurrency(sector.amount)} | {formatPercent(sector.percentage)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-700"
                    style={{ width: `${Math.max(2, Math.min(100, sector.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h3 className="mb-3 text-lg font-black text-gray-950">Top Donor / Source Aggregates</h3>
          <TopDonorsList donors={funding.topDonors} totalRaised={funding.totalRaised} />
          <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
            Names can represent PACs, committees, occupations, employers, or organization aggregates depending on the source. Treat them as contribution records to inspect, not proof of personal control.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-black text-amber-950">What citizens should inspect</h3>
            <div className="mt-3 space-y-2">
              {donorFlags.map((flag) => (
                <div key={flag.label} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-900">{flag.label}</p>
                    <p className="text-lg font-black text-amber-950">{flag.value}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{flag.note}</p>
                </div>
              ))}
            </div>
          </div>

          {funding.sources.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-black text-gray-950">Data Sources</h3>
              <div className="mt-3 space-y-2">
                {funding.sources.map((src) => (
                  <a
                    key={`${src.name}-${src.url}`}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    {src.name}
                    <span className="block text-gray-500">Retrieved {src.retrievedDate}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FundingMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{detail}</p>
    </div>
  );
}
