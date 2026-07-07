"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type DockVariant = "home" | "profile" | "story" | "race" | "dashboard" | "admin" | "default";
type DockActionKind = "link" | "share" | "question" | "more";

type DockAction = {
  key: string;
  label: string;
  href?: string;
  kind: DockActionKind;
  icon: "search" | "watch" | "source" | "packet" | "dashboard" | "share" | "more" | "compare" | "question" | "review" | "alerts" | "settings";
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_DISMISSED_KEY = "repwatchr.pwaInstallDismissed.v1";
const INSTALL_SESSIONS_KEY = "repwatchr.pwaSessionCount.v1";
const INSTALL_SESSION_MARKER = "repwatchr.pwaSessionSeen.v1";

function currentUrl(pathname: string, search: string) {
  if (typeof window === "undefined") return pathname;
  return `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;
}

function sourceHref(pathname: string, search: string) {
  const route = `${pathname}${search ? `?${search}` : ""}`;
  return `/submit-source?target=${encodeURIComponent(route)}`;
}

function raceCompareHref(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1] || "";
  if (!slug || ["elections", "texas", "races", "compare"].includes(slug)) return "/elections";
  return `/compare/race/${encodeURIComponent(slug)}`;
}

function detectVariant(pathname: string): DockVariant {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/news/") || pathname.startsWith("/blog/")) return "story";
  if (pathname.startsWith("/elections") || pathname.startsWith("/races") || pathname.startsWith("/compare/race")) return "race";
  if (
    pathname.startsWith("/officials/") ||
    pathname.startsWith("/public-safety/") ||
    pathname.startsWith("/school-boards/") ||
    pathname.startsWith("/funding/")
  ) {
    return "profile";
  }
  return "default";
}

function dockActions(variant: DockVariant, pathname: string, search: string): DockAction[] {
  const source = sourceHref(pathname, search);
  if (variant === "home") {
    return [
      { key: "search", label: "Search", href: "/search", kind: "link", icon: "search" },
      { key: "source", label: "Source", href: "/submit-source", kind: "link", icon: "source" },
      { key: "packet", label: "Packet", href: "/free-packet", kind: "link", icon: "packet" },
      { key: "dashboard", label: "Dashboard", href: "/dashboard", kind: "link", icon: "dashboard" },
    ];
  }
  if (variant === "profile") {
    return [
      { key: "watch", label: "Watch", href: "/dashboard#watchlist", kind: "link", icon: "watch" },
      { key: "source", label: "Source", href: source, kind: "link", icon: "source" },
      { key: "share", label: "Share", kind: "share", icon: "share" },
      { key: "packet", label: "Packet", href: "/free-packet", kind: "link", icon: "packet" },
      { key: "more", label: "More", kind: "more", icon: "more" },
    ];
  }
  if (variant === "story") {
    return [
      { key: "share", label: "Share", kind: "share", icon: "share" },
      { key: "source", label: "Source", href: source, kind: "link", icon: "source" },
      { key: "watch", label: "Watch", href: "/dashboard#watchlist", kind: "link", icon: "watch" },
      { key: "question", label: "Question", kind: "question", icon: "question" },
      { key: "more", label: "More", kind: "more", icon: "more" },
    ];
  }
  if (variant === "race") {
    return [
      { key: "watch", label: "Watch", href: "/dashboard#watchlist", kind: "link", icon: "watch" },
      { key: "compare", label: "Compare", href: raceCompareHref(pathname), kind: "link", icon: "compare" },
      { key: "source", label: "Source", href: source, kind: "link", icon: "source" },
      { key: "share", label: "Share", kind: "share", icon: "share" },
      { key: "more", label: "More", kind: "more", icon: "more" },
    ];
  }
  if (variant === "dashboard") {
    return [
      { key: "search", label: "Search", href: "/search", kind: "link", icon: "search" },
      { key: "watchlists", label: "Watchlists", href: "/dashboard#watchlist", kind: "link", icon: "watch" },
      { key: "packet", label: "Packet", href: "/free-packet", kind: "link", icon: "packet" },
      { key: "submit", label: "Submit", href: "/submit-source", kind: "link", icon: "source" },
      { key: "settings", label: "Settings", href: "/dashboard/settings", kind: "link", icon: "settings" },
    ];
  }
  if (variant === "admin") {
    return [
      { key: "review", label: "Review", href: "/admin/records-responses", kind: "link", icon: "review" },
      { key: "search", label: "Search", href: "/search", kind: "link", icon: "search" },
      { key: "sources", label: "Sources", href: "/admin/records-responses", kind: "link", icon: "source" },
      { key: "alerts", label: "Alerts", href: "/dashboard/notifications", kind: "link", icon: "alerts" },
      { key: "more", label: "More", kind: "more", icon: "more" },
    ];
  }
  return [
    { key: "search", label: "Search", href: "/search", kind: "link", icon: "search" },
    { key: "watch", label: "Watch", href: "/dashboard#watchlist", kind: "link", icon: "watch" },
    { key: "source", label: "Source", href: source, kind: "link", icon: "source" },
    { key: "packet", label: "Packet", href: "/free-packet", kind: "link", icon: "packet" },
    { key: "dashboard", label: "Dashboard", href: "/dashboard", kind: "link", icon: "dashboard" },
  ];
}

function pageTitle() {
  if (typeof document === "undefined") return "RepWatchr";
  return document.title.replace(" | RepWatchr", "").trim() || "RepWatchr";
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

export default function MobileAppShell() {
  const pathname = usePathname() || "/";
  const [search] = useState(() => (typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "")));
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const variant = useMemo(() => detectVariant(pathname), [pathname]);
  const actions = useMemo(() => dockActions(variant, pathname, search), [pathname, search, variant]);
  const cleanUrl = currentUrl(pathname, search);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration is best-effort; the site stays fully usable without it.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setShowInstallPrompt(false);
      setInstallEvent(null);
      trackRepWatchrEvent("pwa_installed", { route: pathname });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pathname]);

  useEffect(() => {
    let promptTimer: number | null = null;
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return;
      if (window.localStorage.getItem(INSTALL_DISMISSED_KEY)) return;
      if (!window.sessionStorage.getItem(INSTALL_SESSION_MARKER)) {
        const current = Number(window.localStorage.getItem(INSTALL_SESSIONS_KEY) || "0") + 1;
        window.localStorage.setItem(INSTALL_SESSIONS_KEY, String(current));
        window.sessionStorage.setItem(INSTALL_SESSION_MARKER, "1");
      }
      const sessions = Number(window.localStorage.getItem(INSTALL_SESSIONS_KEY) || "0");
      if (sessions >= 3 && installEvent) {
        promptTimer = window.setTimeout(() => {
          setShowInstallPrompt(true);
          trackRepWatchrEvent("pwa_install_prompt_shown", { sessions });
        }, 0);
      }
    } catch {
      // Storage can be disabled. Install prompt remains optional.
    }
    return () => {
      if (promptTimer) window.clearTimeout(promptTimer);
    };
  }, [installEvent]);

  function trackDock(action: DockAction, channel = action.kind) {
    trackRepWatchrEvent("mobile_action_dock_clicked", {
      action: action.key,
      label: action.label,
      variant,
      channel,
      href: action.href || "",
    });
    if (action.key === "watch") {
      trackRepWatchrEvent("profile_watch_clicked", { route: pathname, source: "mobile_action_dock" });
    }
  }

  async function sharePage(action?: DockAction) {
    if (action) trackDock(action, "share");
    const title = pageTitle();
    const text = `RepWatchr public-record page: ${title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: cleanUrl });
        trackRepWatchrEvent("native_share_clicked", { route: pathname, source: "mobile_action_dock" });
        return;
      }
      await copyText(cleanUrl);
      setNotice("Link copied.");
      trackRepWatchrEvent("share_copy_clicked", { route: pathname, source: "mobile_action_dock" });
    } catch {
      // Native share cancellation is normal.
    }
  }

  async function copyQuestion(action?: DockAction) {
    if (action) trackDock(action, "question");
    const question = `Public question for ${pageTitle()}: Which public source confirms the latest record, vote, funding, or meeting update? ${cleanUrl}`;
    const copied = await copyText(question).catch(() => false);
    if (copied) {
      setNotice("Public question copied.");
      trackRepWatchrEvent("public_question_copied", { route: pathname, source: "mobile_action_dock" });
    }
  }

  async function installApp() {
    if (!installEvent) return;
    trackRepWatchrEvent("pwa_install_prompt_clicked", { route: pathname });
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    if (choice?.outcome === "dismissed") {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
      trackRepWatchrEvent("pwa_install_prompt_dismissed", { route: pathname });
    }
    setShowInstallPrompt(false);
    setInstallEvent(null);
  }

  function dismissInstall() {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
    setShowInstallPrompt(false);
    trackRepWatchrEvent("pwa_install_prompt_dismissed", { route: pathname });
  }

  function renderAction(action: DockAction) {
    const content = (
      <>
        <DockIcon icon={action.icon} />
        <span>{action.label}</span>
      </>
    );

    if (action.kind === "share") {
      return (
        <button key={action.key} type="button" className="rw-mobile-dock-button" onClick={() => sharePage(action)} aria-label="Share this RepWatchr page">
          {content}
        </button>
      );
    }
    if (action.kind === "question") {
      return (
        <button key={action.key} type="button" className="rw-mobile-dock-button" onClick={() => copyQuestion(action)} aria-label="Copy a public question">
          {content}
        </button>
      );
    }
    if (action.kind === "more") {
      return (
        <button
          key={action.key}
          type="button"
          className="rw-mobile-dock-button"
          onClick={() => {
            trackDock(action, "more");
            setMoreOpen((current) => !current);
          }}
          aria-expanded={moreOpen}
          aria-label="Open more RepWatchr actions"
        >
          {content}
        </button>
      );
    }
    return (
      <Link key={action.key} href={action.href || "/"} className="rw-mobile-dock-button" onClick={() => trackDock(action)} aria-label={action.label}>
        {content}
      </Link>
    );
  }

  return (
    <>
      {showInstallPrompt ? (
        <aside className="rw-pwa-install-card" aria-label="Install RepWatchr app">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d6b35a]">RepWatchr app shell</p>
            <p className="mt-1 text-sm font-black text-white">Install for faster return trips from meetings, texts, and source packets.</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rw-pwa-install-primary" onClick={installApp}>
              Install
            </button>
            <button type="button" className="rw-pwa-install-secondary" onClick={dismissInstall}>
              Not now
            </button>
          </div>
        </aside>
      ) : null}

      {notice ? <div className="rw-mobile-toast" role="status">{notice}</div> : null}

      {moreOpen ? (
        <aside className="rw-mobile-more-panel" aria-label="More mobile actions">
          <button type="button" onClick={() => sharePage()} className="rw-mobile-more-action">
            Copy or native-share this page
          </button>
          <button type="button" onClick={() => copyQuestion()} className="rw-mobile-more-action">
            Copy safe public question
          </button>
          <Link href={`${pathname}#source-trail`} className="rw-mobile-more-action" onClick={() => setMoreOpen(false)}>
            Open source trail
          </Link>
          <Link href="/dashboard/notifications" className="rw-mobile-more-action" onClick={() => setMoreOpen(false)}>
            Digest settings
          </Link>
        </aside>
      ) : null}

      <nav className="rw-mobile-action-dock" aria-label="Mobile RepWatchr actions">
        {actions.map(renderAction)}
      </nav>
    </>
  );
}

function DockIcon({ icon }: { icon: DockAction["icon"] }) {
  const paths: Record<DockAction["icon"], string[]> = {
    search: ["M10.5 18a7.5 7.5 0 1 1 5.3-12.8A7.5 7.5 0 0 1 10.5 18Z", "M16 16l4 4"],
    watch: ["M12 6c5.2 0 8 6 8 6s-2.8 6-8 6-8-6-8-6 2.8-6 8-6Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
    source: ["M7 4h8l4 4v12H7V4Z", "M14 4v5h5", "M9 13h6", "M9 17h6"],
    packet: ["M5 7l7-4 7 4v10l-7 4-7-4V7Z", "M5 7l7 4 7-4", "M12 11v10"],
    dashboard: ["M4 5h7v7H4V5Z", "M13 5h7v4h-7V5Z", "M13 11h7v8h-7v-8Z", "M4 14h7v5H4v-5Z"],
    share: ["M18 8a3 3 0 1 0-2.8-4", "M6 14a3 3 0 1 0 0 6", "M18 20a3 3 0 1 0 0-6", "M8.7 14.9l6.6 3.2", "M15.2 6.9 8.8 10.1"],
    more: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
    compare: ["M7 4v16", "M17 4v16", "M4 8h6", "M14 16h6"],
    question: ["M9.2 9a3 3 0 1 1 5.1 2.1c-.8.7-1.3 1.1-1.3 2.4", "M12 18h.01"],
    review: ["M5 4h14v16H5V4Z", "M8 9h8", "M8 13h8", "M8 17h5"],
    alerts: ["M12 4a5 5 0 0 0-5 5v4l-2 3h14l-2-3V9a5 5 0 0 0-5-5Z", "M10 19a2 2 0 0 0 4 0"],
    settings: ["M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M19 12h2", "M3 12h2", "M12 3v2", "M12 19v2"],
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[icon].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
