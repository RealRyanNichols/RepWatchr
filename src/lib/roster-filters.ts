import type { JurisdictionSummary } from "@/lib/jurisdiction-explorer";

export type RosterFilters = {
  q: string;
  county: string;
  kind: "all" | "county" | "city";
  status: "all" | "gaps" | "not-started" | "has-records";
  sort: "name" | "gaps" | "records";
};

export function parseRosterFilters(params: Record<string, string | string[] | undefined>): RosterFilters {
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] ?? "" : raw ?? "").trim();
  };
  const kind = value("kind");
  const status = value("status");
  const sort = value("sort");
  return {
    q: value("q").slice(0, 100),
    county: value("county").slice(0, 80),
    kind: kind === "county" || kind === "city" ? kind : "all",
    status: status === "gaps" || status === "not-started" || status === "has-records" ? status : "all",
    sort: sort === "gaps" || sort === "records" ? sort : "name",
  };
}

export function filterJurisdictions(rows: JurisdictionSummary[], filters: RosterFilters) {
  const terms = filters.q.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const searchText = [row.name, ...row.counties, row.kind === "county" ? "county government" : "city town"].join(" ").toLocaleLowerCase("en-US");
    return terms.every((term) => searchText.includes(term))
      && (!filters.county || row.counties.some((county) => county.toLowerCase() === filters.county.toLowerCase()))
      && (filters.kind === "all" || row.kind === filters.kind)
      && (filters.status !== "gaps" || row.missingOfficeCount > 0)
      && (filters.status !== "not-started" || row.profileCount === 0)
      && (filters.status !== "has-records" || row.profileCount > 0);
  }).sort((a, b) => {
    if (filters.sort === "gaps") return b.missingOfficeCount - a.missingOfficeCount || a.name.localeCompare(b.name);
    if (filters.sort === "records") return b.profileCount - a.profileCount || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind);
  });
}
