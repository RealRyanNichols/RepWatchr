"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, isTexasElectionDbSubmissionsEnabled } from "@/lib/supabase";

type PublicContribution = {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_label: string | null;
  contribution_type: string;
  county: string | null;
  city: string | null;
  created_at: string;
};

const publicContributionsEnabled = isTexasElectionDbSubmissionsEnabled;

export default function TexasRacePublicContributions({ raceSlug }: { raceSlug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [contributions, setContributions] = useState<PublicContribution[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadContributions() {
      if (!publicContributionsEnabled) {
        if (mounted) setLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("texas_election_contributions")
        .select("id, title, summary, source_url, source_label, contribution_type, county, city, created_at")
        .eq("race_slug", raceSlug)
        .eq("visibility_status", "public_summary")
        .in("status", ["accepted", "published"])
        .order("created_at", { ascending: false })
        .limit(6);

      if (!mounted) return;
      if (!error) {
        setContributions((data ?? []) as PublicContribution[]);
      }
      setLoaded(true);
    }

    loadContributions();

    return () => {
      mounted = false;
    };
  }, [raceSlug, supabase]);

  if (!publicContributionsEnabled || !loaded || contributions.length === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Contributor records</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Reviewed public submissions for this race
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {contributions.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                {item.contribution_type.replaceAll("_", " ")}
              </span>
              {[item.city, item.county].filter(Boolean).length ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
                  {[item.city, item.county].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-base font-black leading-tight text-blue-950">{item.title}</h3>
            <p className="mt-2 line-clamp-4 text-sm font-semibold leading-6 text-slate-700">
              {item.summary}
            </p>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-black text-blue-800 hover:text-red-700"
            >
              {item.source_label || "Open source"}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
