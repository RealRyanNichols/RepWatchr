import { ImageResponse } from "next/og";
import { getDistrictBranding } from "@/data/school-board-branding";
import {
  getCandidateFlags,
  getCandidateGaps,
  getCandidateGoodRecords,
  getSchoolBoardCandidate,
  getSchoolBoardDistrict,
} from "@/lib/school-board-research";
import { getCandidateDataId, getCandidateUrlSlug, getDistrictDataSlug, getDistrictUrlSlug } from "@/lib/school-board-urls";

export const runtime = "nodejs";

const size = {
  width: 1200,
  height: 630,
};

function initialsFor(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "R"}${parts[1]?.[0] ?? "W"}`.toUpperCase();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const districtSlug = url.searchParams.get("district") ?? "";
  const candidateId = url.searchParams.get("candidate") ?? "";
  const district = getSchoolBoardDistrict(getDistrictDataSlug(districtSlug));
  const candidate = candidateId ? getSchoolBoardCandidate(getCandidateDataId(candidateId)) : undefined;
  const branding = getDistrictBranding(candidate?.district_slug ?? district?.district_slug ?? "");
  const profileName = candidate?.preferred_name ?? candidate?.full_name;
  const title = type === "member" && candidate ? profileName : district?.district ?? "School Board Watch";
  const eyebrow = type === "member" && candidate ? candidate.district : "School Board Watch";
  const subtitle =
    type === "member" && candidate
      ? `${candidate.seat ?? "Seat pending"}${candidate.role ? `, ${candidate.role}` : ""}`
      : "District profile, board-member records, public questions, praise, concerns, and source links.";
  const goodCount = candidate ? getCandidateGoodRecords(candidate).length : district?.candidates.reduce((total, item) => total + getCandidateGoodRecords(item).length, 0) ?? 0;
  const flagCount = candidate ? getCandidateFlags(candidate).length : district?.candidates.reduce((total, item) => total + getCandidateFlags(item).length, 0) ?? 0;
  const gapCount = candidate ? getCandidateGaps(candidate).length : district?.candidates.reduce((total, item) => total + getCandidateGaps(item).length, 0) ?? 0;
  const publicPath =
    type === "member" && candidate
      ? `/school-boards/${getDistrictUrlSlug(candidate.district_slug)}/${getCandidateUrlSlug(candidate)}`
      : district
        ? `/school-boards/${getDistrictUrlSlug(district.district_slug)}`
        : "/school-boards";

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(135deg, #ffffff 0%, ${branding.accent} 46%, #fff7ed 100%)`,
          color: "#111827",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 780 }}>
            <div style={{ color: "#b91c1c", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
              {eyebrow}
            </div>
            <div style={{ color: "#0f172a", fontSize: title && title.length > 32 ? 66 : 78, fontWeight: 900, lineHeight: 1.02 }}>
              {title}
            </div>
            <div style={{ color: "#334155", fontSize: 30, fontWeight: 800, lineHeight: 1.35 }}>
              {subtitle}
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: `linear-gradient(135deg, ${branding.primary}, ${branding.secondary})`,
              border: "8px solid #ffffff",
              borderRadius: 40,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
              color: "#ffffff",
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              height: 230,
              justifyContent: "center",
              width: 230,
            }}
          >
            {initialsFor(title ?? "RepWatchr")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <Badge label="Good records" value={goodCount} color="#047857" />
          <Badge label="Voter questions" value={flagCount} color="#b91c1c" />
          <Badge label="Research gaps" value={gapCount} color="#b45309" />
        </div>

        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ color: "#0f172a", fontSize: 34, fontWeight: 900 }}>RepWatchr</div>
          <div style={{ color: "#334155", fontSize: 24, fontWeight: 800 }}>{publicPath}</div>
        </div>
      </div>
    ),
    size
  );
}

function Badge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "2px solid #e5e7eb",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        minWidth: 210,
        padding: "18px 22px",
      }}
    >
      <div style={{ color, fontSize: 38, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#475569", fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
