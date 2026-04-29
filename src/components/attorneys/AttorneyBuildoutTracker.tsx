import Link from "next/link";
import {
  attorneyNationalSourcePlan,
  getAttorneyBuildoutDashboard,
} from "@/data/attorney-buildout";
import type { PublicPowerProfile } from "@/types/power-watch";

interface AttorneyBuildoutTrackerProps {
  profiles: PublicPowerProfile[];
}

function toneFor(percent: number) {
  if (percent >= 75) return "bg-emerald-600";
  if (percent >= 45) return "bg-blue-700";
  if (percent >= 20) return "bg-amber-500";
  return "bg-red-600";
}

function sourceStatusClass(status: "active" | "source_mapped" | "queued") {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "source_mapped") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export default function AttorneyBuildoutTracker({ profiles }: AttorneyBuildoutTrackerProps) {
  const dashboard = getAttorneyBuildoutDashboard(profiles);
  const prioritySources = dashboard.sources.filter((source) => source.region !== "National queue");
  const queuedSources = dashboard.sources.filter((source) => source.region === "National queue");

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_32%,#d6b35a_32%,#d6b35a_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
      <div className="p-5 lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Attorney launch tracker</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Texas first, then the surrounding states.</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              The attorney buildout now separates source discovery, profile seeding, license verification, cross-linking, and model feedback. A state can be mapped without pretending the attorney records are complete.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="States mapped" value={`${dashboard.sourceMapped}/${dashboard.sources.length}`} detail="Official licensing source path exists for every state." />
              <Metric label="Texas profiles" value={dashboard.texasProfiles} detail="Attorney, firm, and Texas bar-source records loaded." />
              <Metric label="License-linked people" value={`${dashboard.licenseLinkedPeople}/${dashboard.texasAttorneyPeople}`} detail="Texas attorney pages with bar-license source links." />
              <Metric label="Avg buildout" value={`${dashboard.averageCompletion}%`} detail="Average completion across visible attorney-watch records." />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={attorneyNationalSourcePlan.primaryNationalSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                ABA licensing map
              </a>
              <a
                href={attorneyNationalSourcePlan.texasPublicInfoSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-red-300 hover:bg-red-50"
              >
                Texas grievance history
              </a>
              <Link
                href="/buildout"
                className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                Buildout dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {dashboard.stages.map((stage) => (
              <a
                key={stage.id}
                href={stage.href}
                target={stage.href.startsWith("http") ? "_blank" : undefined}
                rel={stage.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{stage.label}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{stage.detail}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-lg font-black text-blue-950">{stage.percent}%</p>
                    <p className="text-[10px] font-black uppercase tracking-wide text-red-700">Rocket stage: {stage.stage}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${toneFor(stage.percent)}`} style={{ width: `${stage.percent}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {stage.current.toLocaleString()} of {stage.target.toLocaleString()} complete
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Priority source ring</p>
            <div className="mt-3 grid gap-2">
              {prioritySources.map((source) => (
                <a
                  key={source.code}
                  href={source.licenseLookupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-blue-100 bg-white p-3 transition hover:border-blue-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{source.state}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{source.licensingAuthority}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${sourceStatusClass(source.status)}`}>
                      {source.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{source.notes}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">National source queue</p>
                <h3 className="text-xl font-black text-slate-950">Every state has a license-source starting point.</h3>
              </div>
              <p className="text-xs font-bold text-slate-500">Checked {dashboard.checkedAt}</p>
            </div>
            <div className="mt-3 grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {queuedSources.map((source) => (
                <a
                  key={source.code}
                  href={source.licenseLookupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-white bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">{source.state}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                      {source.code}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{source.licensingAuthority}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}
