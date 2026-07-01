import { ImageResponse } from "next/og";
import { getFundingSummary, getOfficialById, getRedFlags, getScoreCard } from "@/lib/data";

export const runtime = "nodejs";

const size = {
  width: 1200,
  height: 630,
};

function fitTitle(title: string) {
  if (title.length > 42) return 68;
  return 82;
}

function visualForScore(scoreCard: ReturnType<typeof getScoreCard>) {
  if (!scoreCard) {
    return {
      label: "Source review",
      value: "Open",
      background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 46%, #fff7ed 100%)",
      orb: "linear-gradient(135deg, #0b2a55, #1d4ed8)",
      badge: "#1d4ed8",
      line: "Score not claimed until votes and sources are loaded.",
    };
  }

  if (scoreCard.overall < 60) {
    return {
      label: "Bad record",
      value: `${scoreCard.letterGrade} ${scoreCard.overall}`,
      background: "linear-gradient(135deg, #fff1f2 0%, #ffffff 42%, #ffedd5 100%)",
      orb: "linear-gradient(135deg, #7f1d1d, #dc2626)",
      badge: "#b42318",
      line: "Loaded scorecard points to a poor record. Open the receipts.",
    };
  }

  if (scoreCard.overall >= 80) {
    return {
      label: "Strong record",
      value: `${scoreCard.letterGrade} ${scoreCard.overall}`,
      background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 48%, #eff6ff 100%)",
      orb: "linear-gradient(135deg, #047857, #1d4ed8)",
      badge: "#047857",
      line: "Loaded scorecard points to a strong record. Open the receipts.",
    };
  }

  return {
    label: "Mixed record",
    value: `${scoreCard.letterGrade} ${scoreCard.overall}`,
    background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 48%, #eff6ff 100%)",
    orb: "linear-gradient(135deg, #b45309, #1d4ed8)",
    badge: "#b45309",
    line: "Loaded scorecard is mixed. Read votes, funding, and sources.",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const official = getOfficialById(id);
  const scoreCard = official ? getScoreCard(official.id) : undefined;
  const redFlags = official ? getRedFlags(official.id) : [];
  const funding = official ? getFundingSummary(official.id) : undefined;
  const sourceCount = official?.sourceLinks?.length ?? 0;
  const visual = visualForScore(scoreCard);
  const name = official?.name ?? "RepWatchr Official Profile";
  const title = official ? `${official.position} / ${official.district ?? official.jurisdiction}` : "Public official record";
  const path = official ? `/officials/${official.id}` : "/officials";

  return new ImageResponse(
    (
      <div
        style={{
          background: visual.background,
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #b42318 0%, #b42318 31%, #d6b35a 31%, #d6b35a 44%, #ffffff 44%, #ffffff 58%, #1d4ed8 58%, #1d4ed8 100%)",
            height: 16,
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 820 }}>
            <div style={{ color: visual.badge, fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
              {visual.label} / RepWatchr official profile
            </div>
            <div style={{ color: "#0f172a", fontSize: fitTitle(name), fontWeight: 900, lineHeight: 1.02 }}>
              {name}
            </div>
            <div style={{ color: "#334155", fontSize: 34, fontWeight: 800, lineHeight: 1.25 }}>
              {title}
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: visual.orb,
              border: "8px solid #ffffff",
              borderRadius: 999,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
              color: "#ffffff",
              display: "flex",
              fontSize: 72,
              fontWeight: 900,
              height: 232,
              justifyContent: "center",
              width: 232,
            }}
          >
            {official ? `${official.firstName[0] ?? "R"}${official.lastName[0] ?? "W"}` : "RW"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <Badge label="Score" value={visual.value} color={visual.badge} />
          <Badge label="Flags" value={redFlags.length} color="#b91c1c" />
          <Badge label="Money" value={funding ? "Loaded" : "Review"} color="#b45309" />
          <Badge label="Sources" value={sourceCount} color="#1d4ed8" />
        </div>

        <div style={{ color: "#334155", fontSize: 26, fontWeight: 900, lineHeight: 1.28 }}>
          {visual.line} Search. Grade. Source. Share.
        </div>

        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ color: "#0f172a", fontSize: 34, fontWeight: 900 }}>RepWatchr</div>
          <div style={{ color: "#334155", fontSize: 24, fontWeight: 800 }}>{path}</div>
        </div>
      </div>
    ),
    size
  );
}

function Badge({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "2px solid #e5e7eb",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        minWidth: 190,
        padding: "18px 22px",
      }}
    >
      <div style={{ color, fontSize: 38, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#475569", fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
