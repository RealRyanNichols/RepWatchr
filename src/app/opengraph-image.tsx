import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RepWatchr - Search. Grade. Source. Share.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
              "linear-gradient(90deg,#bf0d3e 0%,#bf0d3e 33%,#ffffff 33%,#ffffff 66%,#002868 66%,#002868 100%)",
          }}
        />
        <div
          style={{
            width: "100%",
            padding: "72px 78px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
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
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              R
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a" }}>
                RepWatchr
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
                Search. Grade. Source. Share.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 72,
                lineHeight: 0.96,
                fontWeight: 900,
                letterSpacing: 0,
                color: "#06172f",
                maxWidth: 980,
              }}
            >
              Make the public record impossible to ignore.
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.25,
                fontWeight: 800,
                color: "#334155",
                maxWidth: 980,
              }}
            >
              Follow the feed, open the record, share the story, and trace officials, school boards, votes, red flags, and funding.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {["Find the name", "Open the record", "Submit the source", "Share the profile"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  borderRadius: 12,
                  border: "2px solid #cbd5e1",
                  background: "#ffffff",
                  padding: "14px 18px",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
