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
};

export function getDistrictBranding(districtSlug: string): SchoolBoardBranding {
  return districtBranding[districtSlug] ?? defaultBranding;
}
