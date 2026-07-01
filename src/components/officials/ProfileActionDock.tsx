"use client";

import Link from "next/link";
import { useState } from "react";
import WatchButton from "@/components/civic/WatchButton";
import { trackEvent } from "@/lib/analytics-client";

type ProfileActionDockProps = {
  officialId: string;
  officialName: string;
  office: string;
  jurisdiction: string;
  profilePath: string;
  sourceCount: number;
};

type ProfileQuickAction = {
  label: string;
  href: string;
  eventName: string;
  action: string;
  tone: string;
};

const SITE_ORIGIN = "https://www.repwatchr.com";

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function fullUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function ProfileActionDock({
  officialId,
  officialName,
  office,
  jurisdiction,
  profilePath,
  sourceCount,
}: ProfileActionDockProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = fullUrl(profilePath);
  const safeShareLine = `${officialName} RepWatchr profile: ${sourceCount} public source${sourceCount === 1 ? "" : "s"} attached for ${office} in ${jurisdiction}. Open the record: ${profileUrl}`;
  const sourceHref = withParams("/sources/submit", {
    targetType: "official",
    targetId: officialId,
    targetName: officialName,
  });
  const correctionHref = withParams("/sources/submit", {
    form: "correction_request",
    targetType: "official",
    targetId: officialId,
    targetName: officialName,
  });
  const packetHref = withParams("/services/free-source-packet", {
    targetType: "official",
    targetId: officialId,
    targetName: officialName,
  });
  const briefHref = withParams("/services/official-record-brief", {
    targetType: "official",
    targetId: officialId,
    targetName: officialName,
  });

  function trackAction(eventName: string, action: string, href?: string) {
    void trackEvent(eventName, {
      official_id: officialId,
      official_name: officialName,
      office,
      jurisdiction,
      action,
      href,
      source_count: sourceCount,
    }, { route: profilePath });
  }

  async function shareProfile() {
    const sharePayload = {
      title: `${officialName} | RepWatchr`,
      text: safeShareLine,
      url: profileUrl,
    };

    trackAction("profile_share_clicked", "share_profile", profileUrl);

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        void trackEvent("native_share_clicked", {
          official_id: officialId,
          official_name: officialName,
          share_channel: "native",
        }, { route: profilePath });
        return;
      } catch {
        // Fall through to copy when the native sheet is dismissed or unavailable.
      }
    }

    await navigator.clipboard.writeText(safeShareLine);
    setCopied(true);
    void trackEvent("share_snippet_copied", {
      official_id: officialId,
      official_name: officialName,
      share_channel: "copy",
    }, { route: profilePath });
    setTimeout(() => setCopied(false), 1800);
  }

  const actions: ProfileQuickAction[] = [
    {
      label: "Submit source",
      href: sourceHref,
      eventName: "submit_source_clicked_from_profile",
      action: "submit_source",
      tone: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/18",
    },
    {
      label: "Correction",
      href: correctionHref,
      eventName: "correction_clicked_from_profile",
      action: "request_correction",
      tone: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/18",
    },
    {
      label: "Packet",
      href: packetHref,
      eventName: "next_action_clicked",
      action: "build_source_packet",
      tone: "bg-amber-300 text-slate-950 shadow-amber-300/25 hover:bg-amber-200",
    },
    {
      label: "Brief",
      href: briefHref,
      eventName: "package_interest_clicked_from_profile",
      action: "request_official_brief",
      tone: "bg-red-600 text-white shadow-red-600/30 hover:bg-red-500",
    },
  ];

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <WatchButton
          entityType="official"
          entityId={officialId}
          entityName={officialName}
          sourceRoute={profilePath}
          interestTags={[office, jurisdiction].filter(Boolean)}
        />
        <button
          type="button"
          onClick={shareProfile}
          className="rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          {copied ? "Copied" : "Share profile"}
        </button>
        {actions.map((item) => (
          <Link
            key={item.action}
            href={item.href}
            onClick={() => trackAction(item.eventName, item.action, item.href)}
            className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wide shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950 ${item.tone}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 px-3 py-2 shadow-[0_-18px_44px_rgba(15,23,42,0.42)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <WatchButton
            entityType="official"
            entityId={officialId}
            entityName={officialName}
            sourceRoute={profilePath}
            interestTags={[office, jurisdiction].filter(Boolean)}
            compact
          />
          <button
            type="button"
            onClick={shareProfile}
            className="rounded-lg bg-white px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-950"
          >
            Share
          </button>
          <Link
            href={sourceHref}
            onClick={() => trackAction("submit_source_clicked_from_profile", "mobile_submit_source", sourceHref)}
            className="rounded-lg border border-white/20 px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white"
          >
            Source
          </Link>
          <Link
            href={packetHref}
            onClick={() => trackAction("next_action_clicked", "mobile_build_source_packet", packetHref)}
            className="rounded-lg bg-amber-300 px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-950"
          >
            Packet
          </Link>
        </div>
      </div>

      <StickyActionRail
        actions={actions}
        onShare={shareProfile}
        onAction={trackAction}
      />
    </>
  );
}

export function StickyActionRail({
  actions,
  onShare,
  onAction,
}: {
  actions: ProfileQuickAction[];
  onShare: () => void;
  onAction: (eventName: string, action: string, href?: string) => void;
}) {
  return (
    <nav
      aria-label="Profile quick actions"
      className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-2 shadow-2xl shadow-slate-950/30 backdrop-blur xl:flex"
    >
      <button
        type="button"
        onClick={onShare}
        className="rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:-translate-x-1"
      >
        Share
      </button>
      {actions.map((item) => (
        <Link
          key={`rail-${item.action}`}
          href={item.href}
          onClick={() => onAction(item.eventName, `rail_${item.action}`, item.href)}
          className={`rounded-xl px-3 py-2 text-center text-xs font-black uppercase tracking-wide transition hover:-translate-x-1 ${item.tone}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
