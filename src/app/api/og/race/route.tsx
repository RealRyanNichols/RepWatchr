import { ImageResponse } from "next/og";
import { getTexasElectionRace } from "@/data/texas-election-races";

export const runtime = "nodejs";

const size = {
  width: 1200,
  height: 630,
};

function fitTitle(title: string) {
  if (title.length > 64) return 58;
  if (title.length > 42) return 68;
  return 78;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const race = getTexasElectionRace(slug);
  const title = race?.title ?? "Texas Election Race Watch";
  const summary = race?.summary ?? "Texas races, East Texas officials, votes, money, source links, and share-ready election records.";
  const path = race ? `/elections/texas/${race.slug}` : "/elections/texas";

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
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 830 }}>
            <div style={{ color: "#b91c1c", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
              {race?.region ?? "Texas"} election watch
            </div>
            <div style={{ color: "#0f172a", fontSize: fitTitle(title), fontWeight: 900, lineHeight: 1.02 }}>
              {title}
            </div>
            <div style={{ color: "#334155", fontSize: 28, fontWeight: 800, lineHeight: 1.35 }}>
              {summary.length > 150 ? `${summary.slice(0, 147)}...` : summary}
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: "linear-gradient(135deg, #0b2a55, #bf0d3e)",
              border: "8px solid #ffffff",
              borderRadius: 38,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              height: 232,
              justifyContent: "center",
              width: 232,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900 }}>Texas</div>
            <div style={{ fontSize: 42, fontWeight: 900 }}>Races</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <Badge label="Focus" value={race?.recordFocus.length ?? 0} color="#1d4ed8" />
          <Badge label="Officials" value={race?.officialIds.length ?? 0} color="#b91c1c" />
          <Badge label="Election" value="2026" color="#b45309" />
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
