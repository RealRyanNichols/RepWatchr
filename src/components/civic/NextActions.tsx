"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { getNextActions, type NextAction, type NextActionContext } from "@/lib/next-actions";

function toneClasses(tone: NextAction["tone"]) {
  switch (tone) {
    case "red":
      return "border-red-300 bg-red-700 text-white shadow-red-900/20 hover:bg-red-800";
    case "blue":
      return "border-blue-300 bg-blue-700 text-white shadow-blue-900/20 hover:bg-blue-800";
    case "gold":
      return "border-amber-300 bg-amber-300 text-blue-950 shadow-amber-900/20 hover:bg-amber-200";
    case "green":
      return "border-emerald-300 bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-700";
    case "dark":
      return "border-slate-700 bg-slate-950 text-white shadow-slate-950/25 hover:bg-blue-950";
  }
}

function trackAction(action: NextAction, route: string) {
  void trackEvent("next_action_clicked", {
    action_type: action.type,
    label: action.label,
    href: action.href,
  }, { route });
}

export function NextActionCards({
  actions,
  route,
}: {
  actions: NextAction[];
  route: string;
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={`${action.type}-${action.href}`}
          href={action.href}
          onClick={() => trackAction(action, route)}
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
  );
}

export function MobileNextActionBar({
  actions,
  route,
}: {
  actions: NextAction[];
  route: string;
}) {
  return (
    <nav
      aria-label="Next useful actions"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-18px_44px_rgba(15,23,42,0.18)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {actions.slice(0, 3).map((action) => (
          <Link
            key={`mobile-${action.type}-${action.href}`}
            href={action.href}
            onClick={() => trackAction(action, route)}
            className={`rounded-lg px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide ${toneClasses(action.tone)}`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function NextActionRail({
  context = {},
  title = "Your next useful click",
  description = "Open the next receipt, compare the record, follow the race, or send the missing source.",
}: {
  context?: NextActionContext;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const route = context.route ?? pathname ?? "/";
  const actions = useMemo(() => getNextActions({ ...context, route }), [context, route]);

  useEffect(() => {
    if (!actions.length) return;
    void trackEvent("next_action_impression", {
      route,
      action_count: actions.length,
      action_types: actions.map((action) => action.type).join(","),
    }, { route });
  }, [actions, route]);

  if (!route || route.startsWith("/api") || route.startsWith("/auth") || route.startsWith("/login") || route.startsWith("/create-account")) {
    return null;
  }

  return (
    <section className="border-t border-blue-100 bg-white pb-16 md:pb-0" data-next-click-engine>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_55%,#fff7ed_100%)] p-4 shadow-xl shadow-blue-950/10 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Keep the record moving</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-blue-950 sm:text-3xl">{title}</h2>
            </div>
            <p className="max-w-2xl text-sm font-bold leading-6 text-slate-600">{description}</p>
          </div>
          <NextActionCards actions={actions} route={route} />
        </div>
      </div>
      <MobileNextActionBar actions={actions} route={route} />
    </section>
  );
}

export default NextActionRail;
