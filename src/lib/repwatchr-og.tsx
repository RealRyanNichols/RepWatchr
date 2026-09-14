/* eslint-disable @next/next/no-img-element */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  REPWATCHR_OG_SIZE,
  REPWATCHR_ORIGIN,
  REPWATCHR_TAGLINE,
  absoluteRepWatchrUrl,
} from "@/lib/repwatchr-seo";

export type RepWatchrOgBadge = {
  label: string;
  value: string | number;
  tone?: "red" | "blue" | "gold" | "green" | "slate";
};

export type RepWatchrOgInput = {
  requestUrl?: string;
  pageType: string;
  headline: string;
  supportLine: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  portraitImage?: string;
  visualCredit?: string;
  jurisdiction?: string;
  metricLabel?: string;
  metricValue?: string | number;
  badges?: RepWatchrOgBadge[];
  path?: string;
};

export const REPWATCHR_EDITORIAL_OG_BACKGROUND =
  "/images/editorial/washington-accountability-blue-hour.webp";

const toneColors: Record<NonNullable<RepWatchrOgBadge["tone"]>, string> = {
  red: "#ff6b6b",
  blue: "#86b7ff",
  gold: "#f3d179",
  green: "#68d9ad",
  slate: "#d6dee8",
};

const defaultBadges: RepWatchrOgBadge[] = [{ label: "Sources", value: "Review", tone: "blue" }];

/**
 * How many badges fit on the footer line before one runs off the card.
 *
 * The footer is a single non-wrapping flex row, so an extra badge does not
 * push the layout down, it walks off the right edge and is gone. This was
 * previously handled by a flat `.slice(0, 2)`, which meant a caller could pass
 * three badges and silently publish two, and every card was held to two even
 * when three short ones would have fit comfortably.
 *
 * Widths are estimated rather than measured because satori does the real
 * layout later and offers no measurement hook here. The per-character figures
 * come from the weights and sizes used below; they are deliberately a little
 * generous, since a card one badge short still reads fine and a card one badge
 * over is visibly broken.
 */
function fitBadges(candidates: RepWatchrOgBadge[], metricValue: string, metricLabel: string) {
  /** 1200 wide, 50px of padding each side, and the path label parked on the right. */
  const AVAILABLE = 1100 - 150;
  const GAP = 26;

  const metricWidth = metricValue.length * 19.8 + 10 + metricLabel.length * 9.9;
  let used = metricWidth;

  const kept: RepWatchrOgBadge[] = [];
  for (const badge of candidates) {
    const width = String(badge.value).length * 14.9 + 8 + truncate(badge.label, 24).length * 8.7;
    if (used + GAP + width > AVAILABLE) break;
    used += GAP + width;
    kept.push(badge);
  }

  // Never return an empty row: one badge slightly over budget still renders,
  // and a bare metric with nothing beside it looks like a mistake.
  return kept.length > 0 ? kept : candidates.slice(0, 1);
}

/** What `fitBadges` would keep, for build-time checks that copy is not being dropped. */
export function badgesThatFit(
  candidates: RepWatchrOgBadge[],
  metricValue: string,
  metricLabel: string,
) {
  return fitBadges(candidates, metricValue, truncate(clean(metricLabel, "Source status"), 28));
}
const embeddedAssetCache = new Map<string, ArrayBuffer>();

function clean(value: string | undefined, fallback: string) {
  return (value || fallback).replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 3).trim()}...`;
}

function fitHeadlineSize(headline: string, hasPortrait: boolean) {
  if (headline.length > 66) return hasPortrait ? 48 : 56;
  if (headline.length > 50) return hasPortrait ? 54 : 64;
  if (headline.length > 34) return hasPortrait ? 62 : 72;
  return hasPortrait ? 70 : 82;
}

function embeddedAssetData(pathOrUrl: string) {
  const cached = embeddedAssetCache.get(pathOrUrl);
  if (cached) return cached;

  try {
    let bytes: Buffer;
    if (pathOrUrl === "/images/og/repwatchr-logo.png") {
      bytes = readFileSync(
        join(process.cwd(), "public/images/og/repwatchr-logo.png"),
      );
    } else if (
      pathOrUrl === "/images/editorial/washington-accountability-blue-hour.webp"
    ) {
      bytes = readFileSync(
        join(
          process.cwd(),
          "public/images/og/washington-accountability-blue-hour.jpg",
        ),
      );
    } else if (
      pathOrUrl === "/images/races/marion-county-judge-2026-hero.webp"
    ) {
      bytes = readFileSync(
        join(
          process.cwd(),
          "public/images/og/marion-county-judge-2026-hero.jpg",
        ),
      );
    } else if (
      pathOrUrl ===
      "/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg"
    ) {
      bytes = readFileSync(
        join(
          process.cwd(),
          "public/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg",
        ),
      );
    } else if (
      pathOrUrl ===
      "/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg"
    ) {
      bytes = readFileSync(
        join(
          process.cwd(),
          "public/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg",
        ),
      );
    } else {
      return undefined;
    }

    const data = Uint8Array.from(bytes).buffer;
    embeddedAssetCache.set(pathOrUrl, data);
    return data;
  } catch {
    return undefined;
  }
}

function assetUrl(pathOrUrl: string, requestUrl?: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  // Drawn artwork arrives already inlined; resolving it against the request
  // origin would turn it into a broken relative path.
  if (pathOrUrl.startsWith("data:")) return pathOrUrl;
  const embedded = embeddedAssetData(pathOrUrl);
  if (embedded) return embedded;
  if (!requestUrl) return absoluteRepWatchrUrl(pathOrUrl);

  const request = new URL(requestUrl);
  const asset = new URL(pathOrUrl, request);
  const previewShareToken = request.searchParams.get("_vercel_share");

  if (previewShareToken && asset.hostname.endsWith(".vercel.app")) {
    asset.searchParams.set("_vercel_share", previewShareToken);
  }

  return asset.toString();
}

export function renderRepWatchrOgImage(input: RepWatchrOgInput) {
  const headline = truncate(clean(input.headline, "Open the public record"), 72);
  const supportLine = truncate(
    clean(input.supportLine, "Public records first. Source links attached."),
    126,
  );
  const jurisdiction = truncate(clean(input.jurisdiction, "United States public accountability"), 86);
  const pageType = truncate(clean(input.pageType, "RepWatchr record"), 42);
  const metricLabel = truncate(clean(input.metricLabel, "Source status"), 28);
  const metricValue = truncate(String(input.metricValue ?? "Review"), 18);
  const path = truncate(clean(input.path, REPWATCHR_ORIGIN), 78);
  const badges = fitBadges(
    input.badges?.length ? input.badges : defaultBadges,
    metricValue,
    metricLabel,
  );
  const backgroundImage = input.backgroundImage
    ? assetUrl(input.backgroundImage, input.requestUrl)
    : undefined;
  const portraitImage = input.portraitImage
    ? assetUrl(input.portraitImage, input.requestUrl)
    : undefined;
  const hasPortrait = Boolean(portraitImage);

  return new ImageResponse(
    (
      <div
        style={{
          width: REPWATCHR_OG_SIZE.width,
          height: REPWATCHR_OG_SIZE.height,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071427",
          color: "#ffffff",
          padding: "42px 50px 38px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {backgroundImage ? (
          <img
            src={backgroundImage as unknown as string}
            width={1200}
            height={630}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: input.backgroundPosition ?? "center",
              zIndex: 0,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(90deg, rgba(3,12,25,0.97) 0%, rgba(5,18,36,0.94) 46%, rgba(5,18,36,0.66) 72%, rgba(3,12,25,0.82) 100%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            display: "flex",
            background: "linear-gradient(90deg, #bf0d3e 0%, #bf0d3e 34%, #f4efe3 34%, #f4efe3 66%, #204f77 66%)",
            zIndex: 3,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img
              src={
                assetUrl(
                  "/images/og/repwatchr-logo.png",
                  input.requestUrl,
                ) as unknown as string
              }
              width={68}
              height={68}
              alt="RepWatchr logo"
              style={{
                borderRadius: 68,
                border: "3px solid #d4a855",
                background: "#ffffff",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 34, fontWeight: 900 }}>RepWatchr</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f3d179" }}>
                {REPWATCHR_TAGLINE}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "3px solid #bf0d3e",
              padding: "8px 0",
              color: "#ffffff",
              fontSize: 19,
              fontWeight: 900,
            }}
          >
            {pageType}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 42,
            flex: 1,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 18,
              width: hasPortrait ? 720 : 980,
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#f3d179",
                fontSize: 23,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {jurisdiction}
            </div>
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: fitHeadlineSize(headline, hasPortrait),
                fontWeight: 900,
                lineHeight: 0.96,
                letterSpacing: -1.6,
                borderLeft: "9px solid #bf0d3e",
                paddingLeft: 20,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                display: "flex",
                color: "#edf4ff",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.24,
                maxWidth: hasPortrait ? 700 : 900,
              }}
            >
              {supportLine}
            </div>
          </div>

          {portraitImage ? (
            <div
              style={{
                width: 300,
                height: 352,
                border: "3px solid rgba(255,255,255,0.88)",
                background: "rgba(5,18,36,0.84)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
                boxShadow: "0 26px 64px rgba(0,0,0,0.42)",
              }}
            >
              <img
                src={portraitImage as unknown as string}
                width={280}
                height={332}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            borderTop: "1px solid rgba(255,255,255,0.34)",
            paddingTop: 16,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ color: "#ffffff", fontSize: 32, fontWeight: 900 }}>{metricValue}</div>
              <div style={{ color: "#d6dee8", fontSize: 17, fontWeight: 800 }}>{metricLabel}</div>
            </div>
            {badges.map((badge) => {
              const tone: NonNullable<RepWatchrOgBadge["tone"]> = badge.tone ?? "blue";
              return (
                <div
                  key={`${badge.label}-${badge.value}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <div style={{ color: toneColors[tone], fontSize: 24, fontWeight: 900 }}>
                    {truncate(String(badge.value), 18)}
                  </div>
                  <div style={{ color: "#d6dee8", fontSize: 15, fontWeight: 800 }}>
                    {truncate(badge.label, 24)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            {input.visualCredit ? (
              <div style={{ color: "#b8c4d2", fontSize: 12, fontWeight: 700 }}>
                {truncate(input.visualCredit, 60)}
              </div>
            ) : null}
            <div style={{ color: "#ffffff", fontSize: 18, fontWeight: 800, textAlign: "right" }}>{path}</div>
          </div>
        </div>
      </div>
    ),
    REPWATCHR_OG_SIZE,
  );
}
