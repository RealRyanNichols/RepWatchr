"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GovernmentLevel, Official, Party, ScoreCard } from "@/types";
import OfficialCard from "@/components/officials/OfficialCard";

const levelOptions: { value: GovernmentLevel | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "county", label: "County" },
  { value: "city", label: "City" },
  { value: "school-board", label: "School Board" },
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

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [levelFilter, setLevelFilter] = useState<GovernmentLevel | "all">(
    (urlLevel as GovernmentLevel) || "all",
  );
  const [partyFilter, setPartyFilter] = useState<Party | "all">("all");
  const [countyFilter, setCountyFilter] = useState("all");

  const counties = useMemo(() => {
    const set = new Set<string>();
    for (const o of officials) {
      for (const c of o.county) {
        set.add(c);
      }
    }
    return Array.from(set).sort();
  }, [officials]);

  const scoreCardMap = useMemo(() => {
    const map = new Map<string, ScoreCard>();
    for (const sc of scoreCards) {
      map.set(sc.officialId, sc);
    }
    return map;
  }, [scoreCards]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return officials.filter((o) => {
      if (levelFilter !== "all" && o.level !== levelFilter) return false;
      if (partyFilter !== "all" && o.party !== partyFilter) return false;
      if (countyFilter !== "all" && !o.county.includes(countyFilter))
        return false;
      if (q) {
        const haystack = `${o.name} ${o.position} ${o.jurisdiction} ${o.district ?? ""} ${o.county.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [officials, levelFilter, partyFilter, countyFilter, searchQuery]);

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-3 shadow-sm sm:p-5">
      {/* Search */}
      <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_auto] lg:items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, office, district, state, or county..."
          aria-label="Search officials by name, office, district, state, or county"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-base"
        />
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-950 shadow-sm lg:text-right">
          Showing {filtered.length} of {officials.length} officials
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-2 sm:mb-6">
        {/* Level filter */}
        <div className="repwatchr-filter-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLevelFilter(opt.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                levelFilter === opt.value
                  ? "bg-blue-700 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Party filter */}
        <div className="hidden flex-wrap gap-1 md:flex">
          {partyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPartyFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                partyFilter === opt.value
                  ? "bg-slate-950 text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 md:hidden">
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value as Party | "all")}
            aria-label="Filter officials by party"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {partyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* County filter */}
        {counties.length > 0 && (
          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            aria-label="Filter officials by county"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-fit md:py-1.5 md:text-xs"
          >
            <option value="all">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
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
    </section>
  );
}
