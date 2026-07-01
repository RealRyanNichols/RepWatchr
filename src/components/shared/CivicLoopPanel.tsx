"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

type AttentionAction = {
  label: string;
  href: string;
  detail: string;
  tone: "red" | "blue" | "gold" | "dark";
};

const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];

function isExcluded(pathname: string) {
  return excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function officialIdFrom(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "officials") return parts[1];
  if (parts.length === 2 && parts[0] === "funding") return parts[1];
  return "";
}

function pageActions(pathname: string): AttentionAction[] {
  const officialId = officialIdFrom(pathname);

  if (pathname.startsWith("/officials/") && officialId) {
    return [
      { label: "Compare Votes", href: "/votes", detail: "Check how this record stacks against loaded roll calls.", tone: "blue" },
      { label: "Compare Funding", href: `/funding/${officialId}`, detail: "Open the money trail attached to this profile.", tone: "gold" },
      { label: "Submit Missing Source", href: "/submit-source", detail: "Add the receipt that should change or complete this dossier.", tone: "red" },
      { label: "See Similar Officials", href: "/officials", detail: "Search the next profile by office, state, score, or source gap.", tone: "dark" },
    ];
  }

  if (pathname.startsWith("/funding/") && officialId) {
    return [
      { label: "Open Related Official", href: `/officials/${officialId}`, detail: "Read the profile behind this funding record.", tone: "blue" },
      { label: "Compare Funding", href: "/funding", detail: "Scan other money trails and donor patterns.", tone: "gold" },
      { label: "Request Review", href: "/services/official-record-brief", detail: "Turn the money trail into a source-backed brief.", tone: "red" },
    ];
  }

  if (pathname.startsWith("/elections")) {
    return [
      { label: "Follow This Race", href: "/elections/texas", detail: "Open the Texas race hub and keep moving through the ballot.", tone: "red" },
      { label: "Latest Sources", href: "/elections/texas/contribute", detail: "Send a filing, finance link, candidate page, or ballot source.", tone: "gold" },
      { label: "Related Stories", href: "/news", detail: "Read recent source-linked election and official coverage.", tone: "blue" },
      { label: "Request Review", href: "/services/local-race-source-pack", detail: "Get a race source pack built from public records.", tone: "dark" },
    ];
  }

  if (pathname.startsWith("/school-boards")) {
    return [
      { label: "Watch This Board", href: "/school-boards", detail: "Open another board, trustee, bond, or meeting lane.", tone: "red" },
      { label: "Submit Missing Source", href: "/submit-source", detail: "Send agendas, minutes, clips, filings, or correction sources.", tone: "gold" },
      { label: "Build Source Packet", href: "/elections/texas/contribute", detail: "Package the record before the next meeting.", tone: "blue" },
    ];
  }

  if (pathname.startsWith("/news/") || pathname.startsWith("/blog")) {
    return [
      { label: "Continue Reading", href: "/news", detail: "Open the next source-linked story.", tone: "blue" },
      { label: "Open Related Official", href: "/officials", detail: "Search the person, office, board, or agency in the record.", tone: "red" },
      { label: "Submit Better Source", href: "/submit-source", detail: "Send a stronger public record or correction link.", tone: "gold" },
    ];
  }

  if (pathname.startsWith("/votes") || pathname.startsWith("/issues") || pathname.startsWith("/scorecards")) {
    return [
      { label: "Compare Votes", href: "/votes", detail: "Move through loaded roll calls and issue scorecards.", tone: "blue" },
      { label: "Open Related Official", href: "/officials", detail: "Find who cast the vote and inspect the dossier.", tone: "red" },
      { label: "Missing Source", href: "/submit-source", detail: "Send the bill text, vote page, agenda, or public record.", tone: "gold" },
    ];
  }

  if (pathname.startsWith("/services")) {
    return [
      { label: "Request Review", href: "/services/quick-record-check", detail: "Start with a fast public-record check.", tone: "red" },
      { label: "Build Source Packet", href: "/elections/texas/contribute", detail: "Use the free packet lane before paying for review.", tone: "gold" },
      { label: "Latest Sources", href: "/submit-source", detail: "Send the record RepWatchr should inspect first.", tone: "blue" },
    ];
  }

  if (pathname.startsWith("/authority-watch") || pathname.startsWith("/attorneys") || pathname.startsWith("/media") || pathname.startsWith("/public-safety")) {
    return [
      { label: "See Similar Officials", href: "/authority-watch", detail: "Open the next public-power profile lane.", tone: "dark" },
      { label: "Request Review", href: "/services/official-record-brief", detail: "Turn a public record trail into a review packet.", tone: "red" },
      { label: "Submit Missing Source", href: "/submit-source", detail: "Add the record that should be checked.", tone: "gold" },
    ];
  }

  if (pathname.startsWith("/red-flags")) {
    return [
      { label: "Open Related Official", href: "/officials", detail: "Tie the flag back to a profile and source trail.", tone: "red" },
      { label: "Latest Sources", href: "/submit-source", detail: "Submit the receipt that confirms, corrects, or narrows the flag.", tone: "gold" },
      { label: "Related Stories", href: "/news", detail: "Read source-linked coverage before sharing.", tone: "blue" },
    ];
  }

  if (pathname.startsWith("/contributors")) {
    return [
      { label: "Build Reputation", href: "/dashboard", detail: "Log a source, vote, funding item, meeting note, fact-check, edit, or community action.", tone: "red" },
      { label: "Submit One Source", href: "/submit-source", detail: "Send the public receipt that should move a profile or story forward.", tone: "gold" },
      { label: "Open Officials", href: "/officials", detail: "Find the next profile that needs a contributor to source the record.", tone: "blue" },
      { label: "Compare Rankings", href: "/contributors", detail: "Check most useful, most verified, highest accuracy, and accepted-source ranks.", tone: "dark" },
    ];
  }

  return [
    { label: "Most Viewed", href: "/officials", detail: "Search the next public official or profile gap.", tone: "red" },
    { label: "Recently Updated", href: "/news", detail: "Open the newest source-linked stories and records.", tone: "blue" },
    { label: "Missing Source", href: "/submit-source", detail: "Send the record that should be attached next.", tone: "gold" },
    { label: "Request Review", href: "/services", detail: "Turn the source trail into a paid review package.", tone: "dark" },
  ];
}

function toneClasses(tone: AttentionAction["tone"]) {
  switch (tone) {
    case "red":
      return "border-red-300 bg-red-700 text-white shadow-red-900/20 hover:bg-red-800";
    case "blue":
      return "border-blue-300 bg-blue-700 text-white shadow-blue-900/20 hover:bg-blue-800";
    case "gold":
      return "border-amber-300 bg-amber-300 text-blue-950 shadow-amber-900/20 hover:bg-amber-200";
    case "dark":
      return "border-slate-700 bg-slate-950 text-white shadow-slate-950/25 hover:bg-blue-950";
  }
}

export default function CivicLoopPanel() {
  const pathname = usePathname();
  if (!pathname || isExcluded(pathname)) return null;

  const actions = pageActions(pathname);

  return (
    <section className="border-t border-blue-100 bg-white" data-attention-mechanism="civic-loop">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_55%,#fff7ed_100%)] p-4 shadow-xl shadow-blue-950/10 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Keep the record moving</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-blue-950 sm:text-3xl">Your next useful click</h2>
            </div>
            <p className="max-w-2xl text-sm font-bold leading-6 text-slate-600">
              Open the next receipt, compare the record, follow the race, or send the missing source.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                onClick={() =>
                  track("attention_mechanism_click", {
                    route: pathname,
                    label: action.label,
                    href: action.href,
                  })
                }
                className={`rw-click-card group min-h-[118px] rounded-2xl border p-4 text-left shadow-lg transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${toneClasses(action.tone)}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] opacity-80">{action.label}</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">Open</span>
                </span>
                <span className="mt-3 block text-sm font-bold leading-5 opacity-90">{action.detail}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
