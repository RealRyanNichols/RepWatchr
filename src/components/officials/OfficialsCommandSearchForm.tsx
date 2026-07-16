"use client";

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
  return (
    <form
      action="/officials"
      autoComplete="off"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const searchValue = String(formData.get("search") ?? "");
        const levelValue = String(formData.get("level") ?? initialLevel);
        const stateValue = String(formData.get("state") ?? selectedStateCode ?? "");

        track("official_button_click", {
          action: "command_deck_open",
          level: levelValue,
          state: stateValue || "national",
          has_search: searchValue.trim() ? "true" : "false",
        });
      }}
      className="grid gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-3 shadow-2xl backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_150px_190px_auto]"
    >
      <label className="min-w-0">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Search name or office</span>
        <input
          name="search"
          defaultValue={initialSearch}
          placeholder="Search by name, office, district, state, or county"
          className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-3.5 text-sm font-black text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40"
        />
      </label>
      <label>
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-300">Level</span>
        <select
          name="level"
          defaultValue={initialLevel}
          onChange={(event) => {
            track("official_filter_change", { filter: "command_level", value: event.target.value });
          }}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-3.5 text-sm font-black text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40"
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
          defaultValue={selectedStateCode ?? ""}
          onChange={(event) => {
            track("official_filter_change", {
              filter: "command_state",
              value: event.target.value || "national",
            });
          }}
          className="mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-3.5 text-sm font-black text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40"
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
        className="rounded-xl bg-amber-300 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_8px_22px_rgba(252,211,77,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-200 motion-reduce:transform-none motion-reduce:transition-none md:self-end"
      >
        Find them →
      </button>
    </form>
  );
}
