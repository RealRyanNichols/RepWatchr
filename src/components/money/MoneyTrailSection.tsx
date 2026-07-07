import Link from "next/link";
import type { FinanceRecord, MoneyTrailDossier } from "@/lib/money-trail";
import { formatCurrency } from "@/lib/formatting";
import MoneyTrailAnalytics from "@/components/money/MoneyTrailAnalytics";

function formatAmount(amount?: number) {
  return typeof amount === "number" ? formatCurrency(amount) : "Amount not loaded";
}

function recordDate(record: FinanceRecord) {
  return record.transactionDate || "Date not loaded";
}

function displayType(value: string) {
  return value.replaceAll("_", " ");
}

export default function MoneyTrailSection({
  trail,
  compact = false,
}: {
  trail: MoneyTrailDossier;
  compact?: boolean;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <MoneyTrailAnalytics
        entityId={trail.official.id}
        entityType="official"
        recordCount={trail.totalRecords}
        sourceCount={trail.sourceCount}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Campaign finance / money trail</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Public filing money trail</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-700">
            Campaign finance records show public filings. RepWatchr does not imply wrongdoing from a contribution or expenditure by itself.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-950">
          {trail.confidenceLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyMetric label="Records" value={trail.totalRecords.toLocaleString()} detail="attached rows" />
        <MoneyMetric label="Amount" value={formatAmount(trail.totalAmount)} detail="reliable total when loaded" />
        <MoneyMetric label="Cycles" value={trail.cycles.length ? trail.cycles.join(", ") : "Needs cycle"} detail="filing period" />
        <MoneyMetric label="Sources" value={trail.sourceCount.toLocaleString()} detail="public links" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <RecordTable
            title="Contribution Records"
            empty="No contribution rows are loaded yet. Submit the filing or donor report source before making donor claims."
            records={trail.contributions}
          />
          <RecordTable
            title="Expenditure Records"
            empty="No itemized expenditure/payee rows are loaded yet. Total spent can be shown only as an aggregate until payees are sourced."
            records={trail.expenditures}
          />
          {compact ? null : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Safe public explanation</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                These records are filing rows, aggregates, committee links, or source paths. They can show who gave, who received,
                where the filing lives, and what still needs review. They do not prove policy influence or misconduct by themselves.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-black text-slate-950">Committees and Filing Sources</h3>
            <div className="mt-3 space-y-2">
              {trail.committees.length ? (
                trail.committees.map((committee) => (
                  <a
                    key={committee.id}
                    href={committee.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-finance-source={committee.name}
                    className="block rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-blue-800 transition hover:border-blue-300"
                  >
                    {committee.name}
                    <span className="mt-1 block text-xs font-semibold capitalize text-slate-500">{displayType(committee.committeeType)}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm font-semibold leading-6 text-slate-600">Committee or filing links still need review.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-black text-amber-950">Source Gaps</h3>
            <div className="mt-3 space-y-2">
              {trail.sourceGaps.map((gap) => (
                <Link
                  key={gap.id}
                  href={gap.submitUrl}
                  data-finance-gap={gap.label}
                  className="block rounded-lg border border-amber-200 bg-white/80 p-3 transition hover:border-red-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-amber-950">{gap.label}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">{gap.priority}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{gap.why}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-black text-blue-950">Useful package paths</h3>
            <div className="mt-3 grid gap-2">
              {[
                ["Campaign Finance Tracker", "/services/official-record-brief"],
                ["Local Race Source Pack", "/services/local-race-source-pack"],
                ["Official Record Brief", "/services/official-record-brief"],
                ["Election Watch Desk", "/services/election-watch-desk"],
                ["Public Data API", "/data-reports"],
              ].map(([label, href]) => (
                <Link key={label} href={href} data-money-package={label} className="mini-button bg-white">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MoneyMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function RecordTable({ title, records, empty }: { title: string; records: FinanceRecord[]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
      </div>
      {records.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Counterparty</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Cycle</th>
                <th className="p-3">Type</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((record) => (
                <tr key={record.id} data-finance-record={record.recordType}>
                  <td className="p-3 font-bold text-slate-950">
                    {record.counterpartyName || record.committeeName || "Record row"}
                    <span className="block text-xs font-semibold text-slate-500">{record.note}</span>
                  </td>
                  <td className="p-3 font-black text-slate-900">{formatAmount(record.amount)}</td>
                  <td className="p-3 font-semibold text-slate-600">{recordDate(record)}</td>
                  <td className="p-3 font-semibold text-slate-600">{record.cycle || "Needs cycle"}</td>
                  <td className="p-3 font-semibold capitalize text-slate-600">{displayType(record.recordType)}</td>
                  <td className="p-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black uppercase text-emerald-800">
                      {displayType(record.confidence)}
                    </span>
                  </td>
                  <td className="p-3">
                    <a
                      href={record.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-finance-source={record.sourceLabel}
                      className="font-black text-blue-700 hover:text-red-700"
                    >
                      Open source
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-4 text-sm font-semibold leading-6 text-slate-600">{empty}</p>
      )}
    </div>
  );
}
