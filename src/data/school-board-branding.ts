export type SchoolBoardBranding = {
  primary: string;
  secondary: string;
  accent: string;
  label: string;
};

const defaultBranding: SchoolBoardBranding = {
  primary: "#002868",
  secondary: "#bf0d3e",
  accent: "#f8fafc",
  label: "RepWatchr civic",
};

const districtBranding: Record<string, SchoolBoardBranding> = {
  harleton_isd: { primary: "#0f5132", secondary: "#f2c94c", accent: "#f6fff8", label: "Harleton green and gold" },
  marshall_isd: { primary: "#b91c1c", secondary: "#111827", accent: "#fff7f7", label: "Marshall red and black" },
  jefferson_isd: { primary: "#7c2d12", secondary: "#f59e0b", accent: "#fff8ed", label: "Jefferson maroon and gold" },
  longview_isd: { primary: "#006747", secondary: "#111827", accent: "#f0fdf4", label: "Longview green and black" },
  waskom_isd: { primary: "#1d4ed8", secondary: "#facc15", accent: "#eff6ff", label: "Waskom blue and gold" },
  hallsville_isd: { primary: "#7f1d1d", secondary: "#f8fafc", accent: "#fff1f2", label: "Hallsville red and white" },
  ore_city_isd: { primary: "#111827", secondary: "#f59e0b", accent: "#fffbeb", label: "Ore City black and gold" },
  new_diana_isd: { primary: "#1d4ed8", secondary: "#f8fafc", accent: "#eff6ff", label: "New Diana blue and white" },
  pine_tree_isd: { primary: "#166534", secondary: "#f8fafc", accent: "#f0fdf4", label: "Pine Tree green and white" },
  kilgore_isd: { primary: "#b91c1c", secondary: "#f8fafc", accent: "#fff1f2", label: "Kilgore red and white" },
  carthage_isd: { primary: "#b91c1c", secondary: "#111827", accent: "#fff7f7", label: "Carthage red and black" },
  lufkin_isd: { primary: "#7f1d1d", secondary: "#111827", accent: "#fff7f7", label: "Lufkin Panthers red and black" },
  mount_pleasant_isd: { primary: "#0c4a6e", secondary: "#facc15", accent: "#eef6ff", label: "Mount Pleasant blue and gold" },
  whitehouse_isd: { primary: "#7f1d1d", secondary: "#f8fafc", accent: "#fff1f2", label: "Whitehouse red and white" },
  lindale_isd: { primary: "#1e3a8a", secondary: "#f59e0b", accent: "#eef4ff", label: "Lindale blue and gold" },
  tyler_isd: { primary: "#1d4ed8", secondary: "#f8fafc", accent: "#eff6ff", label: "Tyler ISD blue and white" },
  athens_isd: { primary: "#166534", secondary: "#f8fafc", accent: "#f0fdf4", label: "Athens green and white" },
  sulphur_springs_isd: { primary: "#b91c1c", secondary: "#1f2937", accent: "#fff1f2", label: "Sulphur Springs red and black" },
  texarkana_isd: { primary: "#0f172a", secondary: "#fbbf24", accent: "#fffbe9", label: "Texarkana navy and gold" },
  henderson_isd: { primary: "#7e22ce", secondary: "#fbbf24", accent: "#faf5ff", label: "Henderson purple and gold" },
  tatum_isd: { primary: "#0f5132", secondary: "#f8fafc", accent: "#f0fdf4", label: "Tatum green and white" },
  plano_isd: { primary: "#0f172a", secondary: "#dc2626", accent: "#f8fafc", label: "Plano black and red" },
  frisco_isd: { primary: "#1d4ed8", secondary: "#fbbf24", accent: "#eff6ff", label: "Frisco blue and gold" },
  houston_isd: { primary: "#0c2340", secondary: "#cf2030", accent: "#f0f5ff", label: "Houston ISD blue and red" },
  dallas_isd: { primary: "#003594", secondary: "#fdb813", accent: "#eff6ff", label: "Dallas ISD blue and gold" },
  austin_isd: { primary: "#003366", secondary: "#cf2c34", accent: "#eff6ff", label: "Austin ISD blue and red" },
  san_antonio_isd: { primary: "#7c2d12", secondary: "#facc15", accent: "#fff8ed", label: "San Antonio ISD maroon and gold" },
  fort_worth_isd: { primary: "#022851", secondary: "#fdb813", accent: "#eff6ff", label: "Fort Worth ISD blue and gold" },
  katy_isd: { primary: "#7c2d12", secondary: "#fbbf24", accent: "#fff8ed", label: "Katy Tigers maroon and gold" },
  cypress_fairbanks_isd: { primary: "#1e3a8a", secondary: "#dc2626", accent: "#eff6ff", label: "Cy-Fair blue and red" },
  round_rock_isd: { primary: "#0e7490", secondary: "#facc15", accent: "#ecfeff", label: "Round Rock teal and gold" },
  killeen_isd: { primary: "#1e3a8a", secondary: "#f59e0b", accent: "#eff6ff", label: "Killeen blue and gold" },
  conroe_isd: { primary: "#0c2340", secondary: "#cd1041", accent: "#eff6ff", label: "Conroe navy and red" },
  northside_isd: { primary: "#003594", secondary: "#facc15", accent: "#eff6ff", label: "Northside ISD blue and gold" },
};

// Pull any branding contributed by the roster extension module so that
// adding a new district through TEXAS_ROSTER_EXTENSIONS is sufficient.
import { TEXAS_ROSTER_EXTENSIONS } from "@/data/texas-school-board-rosters";

for (const extension of TEXAS_ROSTER_EXTENSIONS) {
  if (extension.branding && !districtBranding[extension.district_slug]) {
    districtBranding[extension.district_slug] = extension.branding;
  }
}

export function getDistrictBranding(districtSlug: string): SchoolBoardBranding {
  return districtBranding[districtSlug] ?? defaultBranding;
}
