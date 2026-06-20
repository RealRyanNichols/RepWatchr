import { ImageResponse } from "next/og";
import { getNewsById, getOfficialById } from "@/lib/data";

export const runtime = "nodejs";

const size = {
  width: 1200,
  height: 630,
};

function scopeLabel(value: string | undefined) {
  if (value === "east-texas") return "East Texas";
  if (value === "national") return "United States";
  return "Texas";
}

function fitTitle(title: string) {
  if (title.length > 88) return 54;
  if (title.length > 62) return 62;
  return 74;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const article = getNewsById(id);
  const officials = article?.officialIds.map((officialId) => getOfficialById(officialId)).filter(Boolean) ?? [];
  const sourceCount = article?.sourceLinks?.length ?? (article?.sourceUrl ? 1 : 0);
  const title = article?.title ?? "RepWatchr Story";
  const summary = article?.summary ?? "Source-backed public-accountability stories, officials, votes, money, and public records.";
  const path = article ? `/news/${article.id}` : "/news";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #eaf2ff 54%, #fff7ed 100%)",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 62,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 830 }}>
            <div style={{ color: "#b91c1c", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
              {scopeLabel(article?.scope)} accountability story
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
              gap: 10,
              height: 232,
              justifyContent: "center",
              width: 232,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900 }}>Rep</div>
            <div style={{ fontSize: 48, fontWeight: 900 }}>Watchr</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <Badge label="Sources" value={sourceCount} color="#047857" />
          <Badge label="Officials" value={officials.length} color="#1d4ed8" />
          <Badge label="Share" value="Ready" color="#b91c1c" />
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
