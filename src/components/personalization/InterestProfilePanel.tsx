"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const visitorIdKey = "repwatchr_visitor_id";

type Interest = {
  slug: string;
  label: string;
  score: number;
  rawEventCount: number;
  lastScoredAt: string | null;
};

type Recommendation = {
  title: string;
  href: string;
  label: string;
  detail: string;
  reason: string;
};

type InterestResponse = {
  ok: boolean;
  personalized: boolean;
  interests: Interest[];
  recommendations: {
    stories: Recommendation[];
    officials: Recommendation[];
    races: Recommendation[];
    homepageLanes: Recommendation[];
    dashboardModules: Recommendation[];
    watchlistSuggestions: Recommendation[];
    emailDigestTopics: string[];
    alertTopics: string[];
  };
};

function readAnonymousId() {
  try {
    return localStorage.getItem(visitorIdKey) ?? "";
  } catch {
    return "";
  }
}

function cardSet(data: InterestResponse, variant: "homepage" | "dashboard") {
  if (variant === "dashboard") {
    return [
      ...data.recommendations.dashboardModules,
      ...data.recommendations.watchlistSuggestions,
    ].slice(0, 4);
  }

  return [
    ...data.recommendations.homepageLanes,
    ...data.recommendations.stories,
    ...data.recommendations.races,
  ].slice(0, 4);
}

export default function InterestProfilePanel({ variant = "homepage" }: { variant?: "homepage" | "dashboard" }) {
  const [data, setData] = useState<InterestResponse | null>(null);

  useEffect(() => {
    const anonymousId = readAnonymousId();
    const url = anonymousId
      ? `/api/personalization/interest-profile?anonymousId=${encodeURIComponent(anonymousId)}`
      : "/api/personalization/interest-profile";

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;
        const nextData = (await response.json()) as InterestResponse;
        if (!cancelled && nextData.ok) setData(nextData);
      } catch {
        // Personalization must never block the page.
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const recommendations = useMemo(() => (data ? cardSet(data, variant) : []), [data, variant]);

  if (!data || !recommendations.length) return null;

  const title = variant === "dashboard" ? "Your interest graph" : "Record lanes opening for you";
  const body = data.personalized
    ? "These links shift as you search, open profiles, share records, build packets, and follow issue lanes."
    : "Start clicking records and this block will tighten around the officials, issues, races, and stories you actually inspect.";

  return (
    <section className={variant === "dashboard" ? "mt-6" : "border-b border-blue-100 bg-white"}>
      <div className={variant === "dashboard" ? "" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-[radial-gradient(circle_at_top_left,#eff6ff_0%,#ffffff_38%,#fff7ed_100%)] shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.4fr]">
            <div className="border-b border-blue-100 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Interest profile
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950 sm:text-3xl">
                {title}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.interests.slice(0, 6).map((interest) => (
                  <span
                    key={interest.slug}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm"
                    title={`${Math.round(interest.score)} interest points`}
                  >
                    {interest.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {recommendations.map((item) => (
                <Link
                  key={`${item.href}-${item.title}`}
                  href={item.href}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label={`Open recommended RepWatchr lane: ${item.title}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-800">
                      {item.label}
                    </p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-800 transition group-hover:bg-red-50 group-hover:text-red-700">
                      Open
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-black leading-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                    {item.detail}
                  </p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-red-700">
                    {item.reason}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
