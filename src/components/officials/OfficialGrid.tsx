"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import type { GovernmentLevel, Official, Party, ScoreCard } from "@/types";
import OfficialCard from "@/components/officials/OfficialCard";

const levelOptions: { value: GovernmentLevel | "all"; label: string }[] = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "county", label: "County" },
  { value: "city", label: "City" },
  { value: "school-board", label: "School Board" },
  { value: "all", label: "All loaded" },
];

const partyOptions: { value: Party | "all"; label: string }[] = [
  { value: "all", label: "All Parties" },
  { value: "R", label: "Republican" },
  { value: "D", label: "Democrat" },
  { value: "VR", label: "Votes Republican" },
  { value: "VD", label: "Votes Democrat" },
  { value: "I", label: "Independent" },
  { value: "NP", label: "Nonpartisan / Unknown" },
];

interface OfficialGridProps {
  officials: Official[];
  scoreCards: ScoreCard[];
}

export default function OfficialGrid({
  officials,
  scoreCards,
}: OfficialGridProps) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const urlLevel = searchParams.get("level") ?? "";
  const initialLevel = levelOptions.some((option) => option.value === urlLevel)
    ? (urlLevel as GovernmentLevel | "all")
    : "federal";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [levelFilter, setLevelFilter] = useState<GovernmentLevel | "all">(initialLevel);
  const [partyFilter, setPartyFilter] = useState<Party | "all">("all");
  const [countyFilter, setCountyFilter] = useState("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  const counties = useMemo(() => {
    const set = new Set<string>();
    for (const official of officials) {
      for (const county of official.county) {
        set.add(county);
      }
    }
    return Array.from(set).sort();
  }, [officials]);

  const levelCounts = useMemo(() => {
    const counts = new Map<GovernmentLevel | "all", number>();
    counts.set("all", officials.length);
    for (const official of officials) {
      counts.set(official.level, (counts.get(official.level) ?? 0) + 1);
    }
    return counts;
  }, [officials]);

  const jurisdictions = useMemo(() => {
    const set = new Set<string>();
    officials.forEach((official) => {
      if (levelFilter !== "all" && official.level !== levelFilter) return;
      if (partyFilter !== "all" && official.party !== partyFilter) return;
      if (countyFilter !== "all" && !official.county.includes(countyFilter)) return;
      if (official.jurisdiction) set.add(official.jurisdiction);
    });
    return Array.from(set).sort();
  }, [countyFilter, levelFilter, officials, partyFilter]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    officials.forEach((official) => {
      if (levelFilter !== "all" && official.level !== levelFilter) return;
      if (partyFilter !== "all" && official.party !== partyFilter) return;
      if (countyFilter !== "all" && !official.county.includes(countyFilter)) return;
      if (jurisdictionFilter !== "all" && official.jurisdiction !== jurisdictionFilter) return;
      if (official.district) set.add(official.district);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [countyFilter, jurisdictionFilter, levelFilter, officials, partyFilter]);

  const scoreCardMap = useMemo(() => {
    const map = new Map<string, ScoreCard>();
    for (const scoreCard of scoreCards) {
      map.set(scoreCard.officialId, scoreCard);
    }
    return map;
  }, [scoreCards]);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return officials.filter((official) => {
      if (levelFilter !== "all" && official.level !== levelFilter) return false;
      if (partyFilter !== "all" && official.party !== partyFilter) return false;
      if (countyFilter !== "all" && !official.county.includes(countyFilter)) return false;
      if (jurisdictionFilter !== "all" && official.jurisdiction !== jurisdictionFilter) return false;
      if (districtFilter !== "all" && official.district !== districtFilter) return false;
      if (query) {
        const haystack = `${official.name} ${official.position} ${official.jurisdiction} ${official.district ?? ""} ${official.county.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [officials, levelFilter, partyFilter, countyFilter, jurisdictionFilter, districtFilter, searchQuery]);

  const activeLevelLabel = levelOptions.find((option) => option.value === levelFilter)?.label ?? "Federal";

  function trackFilter(filter: string, value: string) {
    track("official_filter_change", {
      filter,
      value,
      level: levelFilter,
      visible_count: String(filtered.length),
    });
  }

  function changeLevel(value: GovernmentLevel | "all") {
    setLevelFilter(value);
    setCountyFilter("all");
    setJurisdictionFilter("all");
    setDistrictFilter("all");
    track("official_button_click", { action: "level_select", value });
  }

  function resetFilters() {
    setSearchQuery("");
    setLevelFilter("federal");
    setPartyFilter("all");
    setCountyFilter("all");
    setJurisdictionFilter("all");
    setDistrictFilter("all");
    track("official_button_click", { action: "reset_filters" });
  }

  function trackSearch() {
    const value = searchQuery.trim();
    if (!value) return;
    track("official_search", {
      query: value,
      level: levelFilter,
      visible_count: String(filtered.length),
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 p-4 text-white sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Official finder</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {activeLevelLabel} selected first.
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Start with federal officials, then drop into state, county, city, district, party, or name search.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left shadow-sm lg:text-right">
            <p className="text-xs font-black uppercase tracking-wide text-slate-300">Showing</p>
            <p className="text-2xl font-black">
              {filtered.length.toLocaleString()} of {officials.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_auto] lg:items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onBlur={trackSearch}
            onKeyDown={(event) => {
              if (event.key === "Enter") trackSearch();
            }}
            placeholder="Search name, office, district, county..."
            aria-label="Search officials by name, office, district, state, or county"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-base"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 shadow-sm transition hover:border-red-300 hover:bg-white"
          >
            Reset to Federal
          </button>
        </div>

        <div className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mb-6 md:grid-cols-2 xl:grid-cols-5">
          <SelectFilter
            label="Level"
            value={levelFilter}
            onChange={(value) => changeLevel(value as GovernmentLevel | "all")}
            options={levelOptions.map((option) => ({
              value: option.value,
              label: `${option.label} (${(levelCounts.get(option.value) ?? 0).toLocaleString()})`,
            }))}
          />
          <SelectFilter
            label="Party"
            value={partyFilter}
            onChange={(value) => {
              setPartyFilter(value as Party | "all");
              trackFilter("party", value);
            }}
            options={partyOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <SelectFilter
            label="County"
            value={countyFilter}
            onChange={(value) => {
              setCountyFilter(value);
              setJurisdictionFilter("all");
              setDistrictFilter("all");
              trackFilter("county", value);
            }}
            options={[
              { value: "all", label: "All counties" },
              ...counties.map((county) => ({ value: county, label: county })),
            ]}
          />
          <SelectFilter
            label="Office / jurisdiction"
            value={jurisdictionFilter}
            onChange={(value) => {
              setJurisdictionFilter(value);
              setDistrictFilter("all");
              trackFilter("jurisdiction", value);
            }}
            options={[
              { value: "all", label: "All offices" },
              ...jurisdictions.map((jurisdiction) => ({ value: jurisdiction, label: jurisdiction })),
            ]}
          />
          <SelectFilter
            label="District"
            value={districtFilter}
            onChange={(value) => {
              setDistrictFilter(value);
              trackFilter("district", value);
            }}
            options={[
              { value: "all", label: "All districts" },
              ...districts.map((district) => ({ value: district, label: district })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((official) => (
            <OfficialCard
              key={official.id}
              official={official}
              scoreCard={scoreCardMap.get(official.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-semibold text-slate-600">
              No officials match the selected filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
