/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPWATCHR_OG_SIZE } from "@/lib/repwatchr-seo";

let headlineFont: ArrayBuffer | undefined;
function loadHeadlineFont() {
  // Unmodified Anton, SIL Open Font License; bundled for reliable OG rendering.
  // The font and license live together in public/fonts/anton.
  headlineFont ??= Uint8Array.from(readFileSync(join(process.cwd(), "public/fonts/anton/Anton-Regular.ttf"))).buffer;
  return headlineFont;
}

type ArticleOgInput = {
  requestUrl: string;
  headline: string;
  location: string;
  topic: string;
  imageUrl?: string;
  imageFocalPoint?: string;
  imageCredit?: string;
  imageAlt?: string;
};

function imageSource(path: string, requestUrl: string) {
  const request = new URL(requestUrl);
  const source = new URL(path, request);
  const previewShareToken = request.searchParams.get("_vercel_share");
  if (previewShareToken && source.hostname === request.hostname && source.hostname.endsWith(".vercel.app")) {
    source.searchParams.set("_vercel_share", previewShareToken);
  }
  return source.toString();
}

function shortLabel(value: string, limit: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function renderArticleOgImage(input: ArticleOgInput) {
  const headline = input.headline.replace(/\s+/g, " ").trim();
  const fontSize = headline.length > 48 ? 88 : headline.length > 30 ? 104 : 118;
  const location = shortLabel(input.location, 40);
  const topic = shortLabel(input.topic, 36);
  const visualType = !input.imageUrl
    ? "EDITORIAL ARTWORK"
    : /illustration|symbolic|artwork/i.test(`${input.imageCredit ?? ""} ${input.imageAlt ?? ""}`)
      ? "EDITORIAL ILLUSTRATION"
      : "STORY VISUAL";
  const background = imageSource(
    input.imageUrl ?? "/images/og/washington-accountability-blue-hour.jpg",
    input.requestUrl,
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 1200,
        height: 630,
        overflow: "hidden",
        background: "#081423",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <img
        src={background}
        alt={input.imageAlt ?? ""}
        width={1200}
        height={630}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: input.imageFocalPoint ?? "center",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, rgba(3,10,19,0.63) 0%, rgba(3,10,19,0.12) 24%, rgba(3,10,19,0.66) 44%, rgba(3,10,19,0.97) 85%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, rgba(3,10,19,0.22), rgba(3,10,19,0))",
        }}
      />
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: 8, background: "#cb2144" }} />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 54,
          top: 40,
          alignItems: "center",
          gap: 18,
          fontSize: 23,
          fontWeight: 700,
          letterSpacing: 1.6,
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "#fff" }}>{location}</span>
        <span style={{ width: 6, height: 6, borderRadius: 6, background: "#ef7089" }} />
        <span style={{ color: "#e4e7ed" }}>{topic}</span>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 52,
          right: 52,
          bottom: 122,
          fontSize,
          fontFamily: "ArticleHeadline",
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          textShadow: "0 3px 20px rgba(0,0,0,0.36)",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 33,
          height: 66,
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.33)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", width: 8, height: 33, background: "#ed385c" }} />
          <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2 }}>RepWatchr</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1.6 }}>READ THE STORY</span>
          <span style={{ fontSize: 12, color: "#aeb9c7", letterSpacing: 1 }}>{visualType}</span>
        </div>
      </div>
    </div>,
    {
      ...REPWATCHR_OG_SIZE,
      fonts: [{ name: "ArticleHeadline", data: loadHeadlineFont(), style: "normal", weight: 400 }],
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  );
}
