"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

type JurisdictionOption = {
  code: string;
  name: string;
};

type OfficialsCommandSearchFormProps = {
  jurisdictions: JurisdictionOption[];
  profileCountsByState: Record<string, number>;
  selectedStateCode?: string;
  initialLevel: string;
  initialSearch: string;
  totalOfficials: number;
};

const levelOptions = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "county", label: "County" },
  { value: "city", label: "City" },
  { value: "school-board", label: "School Board" },
  { value: "all", label: "All loaded" },
];

export default function OfficialsCommandSearchForm({
  jurisdictions,
  profileCountsByState,
  selectedStateCode,
  initialLevel,
  initialSearch,
  totalOfficials,
}: OfficialsCommandSearchFormProps) {
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [levelValue, setLevelValue] = useState(initialLevel);
  const [stateValue, setStateValue] = useState(selectedStateCode ?? "");

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setLevelValue(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    setStateValue(selectedStateCode ?? "");
  }, [selectedStateCode]);

  return (
    <form
      action="/officials"
      autoComplete="off"
      onSubmit={() => {
        track("official_button_click", {
          action: "command_deck_open",
          level: levelValue,
          state: stateValue || "national",
          has_search: searchValue.trim() ? "true" : "false",
        });
      }}
      className="mt-5 grid gap-2 rounded-lg border border-white/10 bg-white/10 p-3 md:grid-cols-[minmax(0,1fr)_150px_190px_auto]"
    >
      <label className="min-w-0">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Search name or office</span>
        <input
          name="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search by name, office, district, state, or county"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 placeholder:text-slate-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <label>
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Level</span>
        <select
          name="level"
          value={levelValue}
          onChange={(event) => {
            setLevelValue(event.target.value);
            track("official_filter_change", { filter: "command_level", value: event.target.value });
          }}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
        >
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">State</span>
        <select
          name="state"
          value={stateValue}
          onChange={(event) => {
            setStateValue(event.target.value);
            track("official_filter_change", {
              filter: "command_state",
              value: event.target.value || "national",
            });
          }}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white px-3 py-3 text-sm font-black text-slate-950 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">National - {totalOfficials.toLocaleString()}</option>
          {jurisdictions.map((state) => {
            const count = profileCountsByState[state.code] ?? 0;
            return (
              <option key={state.code} value={state.code}>
                {state.name}
                {count > 0 ? ` - ${count.toLocaleString()}` : " - queued"}
              </option>
            );
          })}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-[#d5aa3f] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f0c75f] md:self-end"
      >
        Open
      </button>
    </form>
  );
}
