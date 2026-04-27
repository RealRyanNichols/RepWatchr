import { getAllOfficials } from "@/lib/data";
import { getSchoolBoardDistricts } from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export interface PickerMember {
  id: string;
  name: string;
  subline?: string;
  href: string;
}

export interface PickerGroup {
  slug: string;
  label: string;
  county?: string;
  href?: string;
  members: PickerMember[];
}

export interface PickerLevel {
  key: string;
  label: string;
  description: string;
  groups: PickerGroup[];
}

export interface PickerState {
  code: string;
  name: string;
  levels: PickerLevel[];
}

const LEVEL_LABELS: Record<string, { label: string; description: string }> = {
  "school-board": { label: "School Boards", description: "ISD trustees and candidates" },
  federal: { label: "Federal", description: "US House and Senate" },
  state: { label: "State", description: "Texas House, Senate, and statewide officers" },
  county: { label: "County", description: "Judges, commissioners, sheriffs, DAs" },
  city: { label: "City", description: "Mayors and city council" },
};

function officialsToLevel(level: keyof typeof LEVEL_LABELS): PickerLevel | null {
  if (level === "school-board") return null;
  const officials = getAllOfficials().filter((o) => o.level === level);
  if (officials.length === 0) return null;

  // Group by jurisdiction (e.g. "Texas Senate", "Gregg County", "Longview")
  const groupMap = new Map<string, PickerGroup>();
  for (const official of officials) {
    const groupKey = official.jurisdiction || (official.county[0] ?? "Statewide");
    let group = groupMap.get(groupKey);
    if (!group) {
      group = {
        slug: groupKey.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label: groupKey,
        county: official.county[0],
        members: [],
      };
      groupMap.set(groupKey, group);
    }
    group.members.push({
      id: official.id,
      name: official.name,
      subline: official.position,
      href: `/officials/${official.id}`,
    });
  }

  return {
    key: level,
    label: LEVEL_LABELS[level].label,
    description: LEVEL_LABELS[level].description,
    groups: Array.from(groupMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

function schoolBoardLevel(): PickerLevel | null {
  const districts = getSchoolBoardDistricts();
  if (districts.length === 0) return null;
  const groups: PickerGroup[] = districts.map((district) => ({
    slug: district.district_slug,
    label: district.district,
    county: district.county,
    href: getSchoolBoardDistrictUrl(district),
    members: district.candidates.map((candidate) => ({
      id: candidate.candidate_id,
      name: candidate.preferred_name ?? candidate.full_name,
      subline: [candidate.role, candidate.seat].filter(Boolean).join(" · ") || "Trustee",
      href: getSchoolBoardCandidateUrl(candidate),
    })),
  }));
  return {
    key: "school-board",
    label: LEVEL_LABELS["school-board"].label,
    description: LEVEL_LABELS["school-board"].description,
    groups: groups.sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function buildPickerStates(): PickerState[] {
  // Only include states that actually have loaded data to drill into.
  const tx: PickerState = {
    code: "TX",
    name: "Texas",
    levels: [
      schoolBoardLevel(),
      officialsToLevel("federal"),
      officialsToLevel("state"),
      officialsToLevel("county"),
      officialsToLevel("city"),
    ].filter((level): level is PickerLevel => level !== null && level.groups.length > 0),
  };
  return [tx];
}
