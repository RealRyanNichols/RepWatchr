"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import type { NationalJurisdictionBuildout } from "@/data/national-buildout";

interface NationalSpotlightSelectorProps {
  basePath: string;
  selectedStateCode?: string;
  jurisdictions: NationalJurisdictionBuildout[];
  pageLabel: string;
  title: string;
  description: string;
  profileNoun: string;
  profileCountsByState: Record<string, number>;
}

function hrefFor(basePath: string, code?: string) {
  return code ? `${basePath}?state=${encodeURIComponent(code)}` : basePath;
}

function statusClasses(status: NationalJurisdictionBuildout["status"], count: number) {
  if (count > 0 || status === "loaded") return "bg-emerald-100 text-emerald-800";
  if (status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: NationalJurisdictionBuildout["status"], count: number) {
  if (count > 0) return "loaded here";
  if (status === "partial") return "partial";
  if (status === "loaded") return "loaded";
  return "queued";
}

function trackStateChoice(
  pageLabel: string,
  basePath: string,
  code: string,
  count: number,
  source: string,
) {
  track("national_state_choice", {
    page: pageLabel,
    path: basePath,
    state: code || "national",
    loaded_profiles: String(count),
    source,
  });
}

export default function NationalSpotlightSelector({
  basePath,
  selectedStateCode,
  jurisdictions,
  pageLabel,
  title,
  description,
  profileNoun,
  profileCountsByState,
}: NationalSpotlightSelectorProps) {
  const router = useRouter();
  const selected = jurisdictions.find((state) => state.code === selectedStateCode);
  const loadedStateCount = jurisdictions.filter((state) => (profileCountsByState[state.code] ?? 0) > 0).length;
  const loadedProfileCount = jurisdictions.reduce((total, state) => total + (profileCountsByState[state.code] ?? 0), 0);
  const queuedCount = jurisdictions.length - loadedStateCount;
  const showFullGrid = !selectedStateCode;
  const highlightedStates = jurisdictions.filter((state) => (profileCountsByState[state.code] ?? 0) > 0);

  return (
    <section className="rw-hero-panel overflow-hidden rounded-2xl text-slate-950">
      <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{pageLabel}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">{description}</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Choose state</span>
              <select
                value={selectedStateCode ?? ""}
                onChange={(event) => {
                  const code = event.target.value;
                  trackStateChoice(pageLabel, basePath, code, profileCountsByState[code] ?? 0, "dropdown");
                  router.push(hrefFor(basePath, code || undefined));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-[#f8fbff] px-3 py-3 text-sm font-black text-blue-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">National map - pick a state</option>
                {jurisdictions.map((state) => {
                  const count = profileCountsByState[state.code] ?? 0;
                  return (
                    <option key={state.code} value={state.code}>
                      {state.name}{count > 0 ? ` - ${count.toLocaleString()} loaded` : " - queued"}
                    </option>
                  );
                })}
              </select>
            </label>
            {selectedStateCode ? (
              <Link
                href={basePath}
                onClick={() => trackStateChoice(pageLabel, basePath, "", 0, "national_button")}
                className="rw-secondary-button rounded-xl px-4 py-3 text-center text-sm font-black transition"
              >
                National map
              </Link>
            ) : null}
          </div>

          {selected ? (
            <div className="rw-card rw-card-blue mt-4 rounded-xl p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-800">Selected state</p>
              <p className="mt-1 text-xl font-black text-blue-950">{selected.name}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                {(profileCountsByState[selected.code] ?? 0) > 0
                  ? `${(profileCountsByState[selected.code] ?? 0).toLocaleString()} ${profileNoun} are loaded for this page.`
                  : "This state is in the national model, but this page does not have loaded profiles for it yet."}
              </p>
            </div>
          ) : (
            <div className="rw-card rw-card-gold mt-4 rounded-xl p-4">
              <p className="text-xs font-black uppercase tracking-wide text-amber-800">National default</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-950">
                Pick a state before opening the profile list. Loaded states open records now; queued states show what still needs source import.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Jurisdictions" value={jurisdictions.length} detail="States, D.C., and territories in the national model" />
          <Metric label="Loaded here" value={loadedStateCount} detail={`States with ${profileNoun} on this page`} />
          <Metric label={profileNoun} value={loadedProfileCount} detail="Source-seeded records currently visible after state choice" />
          <Metric label="Queued" value={queuedCount} detail="Enabled states still waiting on imports" />
        </div>
      </div>

      {highlightedStates.length > 0 ? (
        <div className="border-t border-slate-200 bg-[#eef6ff]/90 px-5 py-3 lg:px-7">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {highlightedStates.map((state) => (
              <Link
                key={state.code}
                href={hrefFor(basePath, state.code)}
                onClick={() =>
                  trackStateChoice(pageLabel, basePath, state.code, profileCountsByState[state.code] ?? 0, "loaded_chip")
                }
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                  selectedStateCode === state.code
                    ? "border-[#d6b35a] bg-[#0b2a55] text-white"
                    : "border-slate-300 bg-[#f8fbff] text-slate-800 hover:border-[#d6b35a] hover:bg-[#fff7df] hover:text-blue-950"
                }`}
              >
                {state.name}: {(profileCountsByState[state.code] ?? 0).toLocaleString()}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {showFullGrid ? (
        <div className="border-t border-slate-200 bg-[#eef6ff]/90 p-4 lg:p-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {jurisdictions.map((state) => {
              const count = profileCountsByState[state.code] ?? 0;
              return (
                <Link
                  key={state.code}
                  href={hrefFor(basePath, state.code)}
                  onClick={() =>
                    trackStateChoice(pageLabel, basePath, state.code, profileCountsByState[state.code] ?? 0, "state_card")
                  }
                  className="rw-card rounded-xl p-3 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{state.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{state.code}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusClasses(state.status, count)}`}>
                      {statusLabel(state.status, count)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {count > 0 ? `${count.toLocaleString()} ${profileNoun} loaded.` : state.note}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rw-card rounded-xl p-4">
      <p className="text-2xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}
