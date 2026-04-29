"use client";

import { useMemo, useState } from "react";
import type { SchoolBoardState } from "@/data/school-board-states";

type SchoolBoardStatePickerProps = {
  states: SchoolBoardState[];
  showStats?: boolean;
};

export default function SchoolBoardStatePicker({
  states,
  showStats = true,
}: SchoolBoardStatePickerProps) {
  const defaultState = useMemo(
    () => states.find((state) => state.defaultSelected)?.code ?? "TX",
    [states]
  );
  const [selectedCode, setSelectedCode] = useState(() => {
    if (typeof window === "undefined") return defaultState;
    const stored = window.localStorage.getItem("repwatchr-school-board-state");
    return stored && states.some((state) => state.code === stored) ? stored : defaultState;
  });

  const selectedState = states.find((state) => state.code === selectedCode) ?? states[0];

  function handleStateChange(code: string) {
    setSelectedCode(code);
    window.localStorage.setItem("repwatchr-school-board-state", code);
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">
            United States index
          </p>
          <h2 className="mt-1 text-2xl font-black text-blue-950">
            Pick a state
          </h2>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-gray-600">
            Texas opens first by default. Every other state is queued for district
            import, board roster verification, and evidence review before a board
            member is counted as live.
          </p>
        </div>
        <label className="block min-w-full sm:min-w-[16rem]">
          <span className="text-xs font-black uppercase tracking-wide text-gray-500">
            Default watch state
          </span>
          <select
            value={selectedCode}
            onChange={(event) => handleStateChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-sm font-black text-blue-950 outline-none transition focus:border-red-400 focus:bg-white"
          >
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} {state.status === "loaded" ? "loaded" : "queued"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showStats ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StateStat label="State" value={selectedState.name} />
          <StateStat label="Verified districts live" value={String(selectedState.districtsLoaded)} />
          <StateStat label="Verified profiles live" value={String(selectedState.profilesLoaded)} />
          {selectedState.directoryTargetLabel ? (
            <StateStat label="Directory target" value={selectedState.directoryTargetLabel} />
          ) : selectedState.status === "queued" ? (
            <StateStat label="Directory target" value="NCES + state source queued" />
          ) : null}
          {selectedState.targetLabel ? (
            <StateStat label="Trustee target" value={selectedState.targetLabel} />
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-950">
          {selectedState.status === "loaded" ? "Live build" : "Queued for import"}
        </p>
        <ul className="mt-2 grid gap-2 text-sm font-semibold leading-6 text-amber-950 sm:grid-cols-2">
          {selectedState.sourcePlan.slice(0, 6).map((item) => (
            <li key={item} className="border-l-4 border-amber-500 bg-white/70 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StateStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-black text-gray-950">{value}</p>
    </div>
  );
}
