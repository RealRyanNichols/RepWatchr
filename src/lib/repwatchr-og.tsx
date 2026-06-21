/* eslint-disable @next/next/no-img-element */
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
  title: string;
  subtitle?: string;
  jurisdiction?: string;
  metricLabel?: string;
  metricValue?: string | number;
  badges?: RepWatchrOgBadge[];
  path?: string;
};

const toneColors: Record<NonNullable<RepWatchrOgBadge["tone"]>, string> = {
  red: "#dc2626",
  blue: "#2563eb",
  gold: "#d4a855",
  green: "#059669",
  slate: "#64748b",
};

const defaultBadges: RepWatchrOgBadge[] = [{ label: "Sources", value: "Review", tone: "blue" }];

function clean(value: string | undefined, fallback: string) {
  return (value || fallback).replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 3).trim()}...`;
}

function fitTitleSize(title: string) {
  if (title.length > 104) return 42;
  if (title.length > 78) return 50;
  if (title.length > 52) return 60;
  return 74;
}

function logoUrl(requestUrl?: string) {
  if (!requestUrl) return absoluteRepWatchrUrl("/images/repwatchr-logo-america-first.png");
  return new URL("/images/repwatchr-logo-america-first.png", requestUrl).toString();
}

export function renderRepWatchrOgImage(input: RepWatchrOgInput) {
  const title = truncate(clean(input.title, "RepWatchr public record"), 132);
  const subtitle = truncate(clean(input.subtitle, "Public records first. Source links attached."), 158);
  const jurisdiction = truncate(clean(input.jurisdiction, "United States public accountability"), 86);
  const pageType = truncate(clean(input.pageType, "RepWatchr record"), 42).toUpperCase();
  const metricLabel = truncate(clean(input.metricLabel, "Source status"), 28);
  const metricValue = truncate(String(input.metricValue ?? "Review"), 18);
  const path = truncate(clean(input.path, REPWATCHR_ORIGIN), 78);
  const badges: RepWatchrOgBadge[] = (input.badges?.length ? input.badges : defaultBadges).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #071427 0%, #0f1f3d 56%, #190c13 100%)",
          color: "#ffffff",
          padding: 54,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -95,
            top: -115,
            width: 430,
            height: 430,
            borderRadius: 430,
            background: "rgba(191, 13, 62, 0.28)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 116,
            bottom: -160,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: "rgba(212, 168, 85, 0.16)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img
              src={logoUrl(input.requestUrl)}
              width={98}
              height={98}
              alt="RepWatchr logo"
              style={{
                borderRadius: 98,
                border: "4px solid #d4a855",
                background: "#ffffff",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 0 }}>RepWatchr</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f3d179", letterSpacing: 2 }}>
                {REPWATCHR_TAGLINE}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "2px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              borderRadius: 999,
              padding: "13px 22px",
              color: "#fee2e2",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            {pageType}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: 34 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, width: 760 }}>
            <div
              style={{
                display: "flex",
                borderLeft: "8px solid #bf0d3e",
                paddingLeft: 16,
                color: "#cbd5e1",
                fontSize: 27,
                fontWeight: 900,
                lineHeight: 1.22,
              }}
            >
              {jurisdiction}
            </div>
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: fitTitleSize(title),
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: 0,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                color: "#dbeafe",
                fontSize: 29,
                fontWeight: 800,
                lineHeight: 1.28,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              width: 286,
              minHeight: 286,
              borderRadius: 34,
              border: "3px solid rgba(255,255,255,0.24)",
              background: "rgba(255,255,255,0.96)",
              color: "#0f172a",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              boxShadow: "0 30px 80px rgba(0,0,0,0.32)",
            }}
          >
            <div style={{ color: "#bf0d3e", fontSize: 76, fontWeight: 900, lineHeight: 0.95 }}>{metricValue}</div>
            <div
              style={{
                marginTop: 12,
                color: "#334155",
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1.12,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {metricLabel}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 26 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {badges.map((badge) => {
              const tone: NonNullable<RepWatchrOgBadge["tone"]> = badge.tone ?? "blue";
              return (
                <div
                  key={`${badge.label}-${badge.value}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 176,
                    borderRadius: 18,
                    border: "2px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.10)",
                    padding: "14px 18px",
                  }}
                >
                  <div style={{ color: toneColors[tone], fontSize: 30, fontWeight: 900 }}>
                    {truncate(String(badge.value), 18)}
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: 17, fontWeight: 900, textTransform: "uppercase" }}>
                    {truncate(badge.label, 24)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 22, fontWeight: 800, textAlign: "right" }}>{path}</div>
        </div>
      </div>
    ),
    REPWATCHR_OG_SIZE,
  );
}
