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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const official = getOfficialById(id);
  const scoreCard = official ? getScoreCard(official.id) : undefined;
  const redFlags = official ? getRedFlags(official.id) : [];
  const funding = official ? getFundingSummary(official.id) : undefined;
  const name = official?.name ?? "RepWatchr Official Profile";
  const title = official ? `${official.position} / ${official.district ?? official.jurisdiction}` : "Public official record";
  const path = official ? `/officials/${official.id}` : "/officials";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 52%, #fff7ed 100%)",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 820 }}>
            <div style={{ color: "#b91c1c", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
              RepWatchr official profile
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
              background: "linear-gradient(135deg, #0b2a55, #bf0d3e)",
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
          <Badge label="Score" value={scoreCard ? scoreCard.overall : "Open"} color="#1d4ed8" />
          <Badge label="Flags" value={redFlags.length} color="#b91c1c" />
          <Badge label="Money" value={funding ? "Loaded" : "Review"} color="#b45309" />
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
