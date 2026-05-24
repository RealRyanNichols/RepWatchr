import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RepWatchr Feed - Political Attention Engine";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  const lanes = ["Officials", "Schools", "Money", "Votes", "Red Flags", "Sources"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 16,
            background:
              "linear-gradient(90deg,#bf0d3e 0%,#bf0d3e 32%,#d6b35a 32%,#d6b35a 44%,#ffffff 44%,#ffffff 58%,#002868 58%,#002868 100%)",
          }}
        />
        <div
          style={{
            width: "100%",
            padding: "70px 78px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 18,
                  background: "#bf0d3e",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                RW
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a" }}>
                  RepWatchr Feed
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#bf0d3e",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Political attention engine
                </div>
              </div>
            </div>
            <div
              style={{
                borderRadius: 999,
                border: "2px solid #cbd5e1",
                background: "#ffffff",
                padding: "12px 18px",
                fontSize: 18,
                fontWeight: 900,
                color: "#06172f",
              }}
            >
              Read / Share / Source
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 70,
                lineHeight: 0.96,
                fontWeight: 900,
                letterSpacing: 0,
                color: "#06172f",
                maxWidth: 1020,
              }}
            >
              Stories that travel like posts and land like records.
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.25,
                fontWeight: 800,
                color: "#334155",
                maxWidth: 980,
              }}
            >
              Public officials, school boards, votes, money, red flags, source drops, and shareable accountability snippets.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {lanes.map((lane) => (
              <div
                key={lane}
                style={{
                  display: "flex",
                  borderRadius: 999,
                  border: "2px solid #cbd5e1",
                  background: "#ffffff",
                  padding: "12px 18px",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {lane}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
