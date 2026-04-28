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
    <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, office, district, state, or county..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* Level filter */}
        <div className="flex flex-wrap gap-1">
          {levelOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLevelFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
        <div className="flex flex-wrap gap-1">
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

        {/* County filter */}
        {counties.length > 0 && (
          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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

      {/* Results count */}
      <p className="mb-4 text-sm font-semibold text-slate-600">
        Showing {filtered.length} of {officials.length} officials
      </p>

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
