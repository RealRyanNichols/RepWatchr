import { getAllNationalJurisdictions } from "@/data/national-buildout";

type SearchParamValue = string | string[] | undefined;

export function getSelectedStateCode(params: Record<string, SearchParamValue>, key = "state") {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const code = value?.trim().toUpperCase();

  if (!code) return undefined;

  const exists = getAllNationalJurisdictions().some((state) => state.code === code);
  return exists ? code : undefined;
}

export function countByState<T>(records: T[], getState: (record: T) => string | undefined, fallbackState?: string) {
  return records.reduce<Record<string, number>>((counts, record) => {
    const code = (getState(record) ?? fallbackState)?.toUpperCase();
    if (!code) return counts;
    counts[code] = (counts[code] ?? 0) + 1;
    return counts;
  }, {});
}
