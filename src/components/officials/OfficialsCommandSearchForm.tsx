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
      className="grid gap-x-4 gap-y-3 border-y border-white/20 py-4 sm:grid-cols-2"
    >
      <label className="min-w-0 sm:col-span-2">
        <span className="text-xs font-semibold text-slate-300">Search by name or office</span>
        <input
          name="search"
          defaultValue={initialSearch}
          placeholder="Search by name, office, district, state, or county"
          className="mt-1 w-full rounded-sm border border-white/30 bg-white px-3 py-3 text-base font-semibold text-slate-950 placeholder:font-normal placeholder:text-slate-500 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40"
        />
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-300">Level of government</span>
        <select
          name="level"
          defaultValue={initialLevel}
          onChange={(event) => {
            track("official_filter_change", { filter: "command_level", value: event.target.value });
          }}
          className="mt-1 w-full rounded-sm border border-white/30 bg-white px-3 py-3 text-base font-semibold text-slate-950 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40"
        >
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold text-slate-300">State or national view</span>
        <select
          name="state"
          defaultValue={selectedStateCode ?? ""}
          onChange={(event) => {
            track("official_filter_change", {
              filter: "command_state",
              value: event.target.value || "national",
            });
          }}
          className="mt-1 w-full rounded-sm border border-white/30 bg-white px-3 py-3 text-base font-semibold text-slate-950 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40"
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
        className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-amber-300 px-6 py-3 text-base font-bold text-slate-950 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:col-span-2 sm:w-auto"
      >
        Find officials →
      </button>
    </form>
  );
}
