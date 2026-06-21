"use client";

import { useEffect, useState } from "react";

type PublicContribution = {
  id: string;
  source_title: string | null;
  claim_summary: string;
  source_url: string;
  source_type: string;
  jurisdiction: string | null;
  source_date: string | null;
  created_at: string;
};

export default function TexasRacePublicContributions({ raceSlug }: { raceSlug: string }) {
  const [contributions, setContributions] = useState<PublicContribution[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadContributions() {
      const params = new URLSearchParams({
        targetType: "texas_election_race",
        targetProfileId: raceSlug,
        limit: "6",
      });
      const response = await fetch(`/api/source-submissions?${params.toString()}`, {
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as
        | { submissions?: PublicContribution[] }
        | null;

      if (!mounted) return;
      setContributions(Array.isArray(result?.submissions) ? result.submissions : []);
      setLoaded(true);
    }

    loadContributions();

    return () => {
      mounted = false;
    };
  }, [raceSlug]);

  if (!loaded || contributions.length === 0) return null;

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
                {item.source_type.replaceAll("_", " ")}
              </span>
              {item.jurisdiction ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-700">
                  {item.jurisdiction}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-base font-black leading-tight text-blue-950">
              {item.source_title || "Reviewed source"}
            </h3>
            <p className="mt-2 line-clamp-4 text-sm font-semibold leading-6 text-slate-700">
              {item.claim_summary}
            </p>
            {item.source_date ? (
              <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
                Source date: {item.source_date}
              </p>
            ) : null}
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-black text-blue-800 hover:text-red-700"
            >
              Open source
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
