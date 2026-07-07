import Link from "next/link";
import type { RaceHubRace } from "@/lib/race-hub";
import { getMoneyTrailsForOfficials } from "@/lib/money-trail";
import { formatCurrency } from "@/lib/formatting";
import MoneyTrailAnalytics from "@/components/money/MoneyTrailAnalytics";

export default function RaceMoneyTrailSection({ race }: { race: RaceHubRace }) {
  const trails = getMoneyTrailsForOfficials(race.candidates.map((candidate) => candidate.id));
  const loaded = trails.filter((trail) => trail.funding);
  const totalRaised = loaded.reduce((sum, trail) => sum + (trail.totalAmount ?? 0), 0);
  const sourceCount = trails.reduce((sum, trail) => sum + trail.sourceCount, 0);

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <MoneyTrailAnalytics entityId={race.slug} entityType="race" recordCount={trails.reduce((sum, trail) => sum + trail.totalRecords, 0)} sourceCount={sourceCount} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Race money trail</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Candidate finance links and source gaps</h2>
      <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-700">
        Money rows here are public filing records or source paths. They do not imply corruption or support by themselves.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <RaceMoneyMetric label="Candidates with finance loaded" value={`${loaded.length}/${race.candidates.length}`} />
        <RaceMoneyMetric label="Reported total raised" value={loaded.length ? formatCurrency(totalRaised) : "Needs filings"} />
        <RaceMoneyMetric label="Finance sources" value={sourceCount.toLocaleString()} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Cycle</th>
              <th className="p-3">Total raised</th>
              <th className="p-3">Records</th>
              <th className="p-3">Source status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {race.candidates.map((candidate) => {
              const trail = trails.find((item) => item.official.id === candidate.id);
              return (
                <tr key={candidate.id} data-finance-record="race_candidate_finance">
                  <td className="p-3 font-black text-blue-950">{candidate.name}</td>
                  <td className="p-3 font-semibold text-slate-700">{trail?.cycles.join(", ") || "Needs cycle"}</td>
                  <td className="p-3 font-semibold text-slate-700">{trail?.totalAmount ? formatCurrency(trail.totalAmount) : "Needs filing total"}</td>
                  <td className="p-3 font-semibold text-slate-700">{trail?.totalRecords ?? 0}</td>
                  <td className="p-3 font-semibold text-slate-700">{trail?.confidenceLabel ?? "Finance source needed"}</td>
                  <td className="p-3">
                    {candidate.financeHref ? (
                      <Link href={candidate.financeHref} className="mini-button" data-finance-source={candidate.name}>
                        Open funding
                      </Link>
                    ) : (
                      <Link href={`/elections/texas/contribute?race=${encodeURIComponent(race.slug)}&type=funding_record`} className="mini-button" data-finance-gap={candidate.name}>
                        Submit source
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {["Campaign Finance Tracker", "Local Race Source Pack", "Election Watch Desk"].map((label) => (
          <Link key={label} href={label === "Local Race Source Pack" ? "/services/local-race-source-pack" : "/services/election-watch-desk"} data-money-package={label} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-900 transition hover:border-red-300 hover:bg-white">
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function RaceMoneyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
    </div>
  );
}
