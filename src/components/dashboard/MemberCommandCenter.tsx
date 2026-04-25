"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import GideonConsole from "@/components/gideon/GideonConsole";
import { createClient } from "@/lib/supabase";

type TrackedItem = {
  id?: string;
  label: string;
  href: string;
  type: "official" | "school_board" | "county" | "race" | "research";
};

const defaultTracked: TrackedItem[] = [
  { label: "School Board Watch", href: "/school-boards", type: "school_board" },
  { label: "East Texas Officials", href: "/officials", type: "official" },
];

const mapZones = [
  { label: "Federal", href: "/officials?level=federal", tone: "bg-blue-900 text-white" },
  { label: "Texas State", href: "/officials?level=state", tone: "bg-red-700 text-white" },
  { label: "Counties", href: "/officials?level=county", tone: "bg-amber-100 text-amber-950" },
  { label: "Cities", href: "/officials?level=city", tone: "bg-blue-100 text-blue-950" },
  { label: "School Boards", href: "/school-boards", tone: "bg-emerald-100 text-emerald-950" },
];

export default function MemberCommandCenter() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tracked, setTracked] = useState<TrackedItem[]>(defaultTracked);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [type, setType] = useState<TrackedItem["type"]>("official");
  const [backendStatus, setBackendStatus] = useState("Synced locally");

  useEffect(() => {
    async function loadTrackedItems() {
      if (!user) {
        const saved = window.localStorage.getItem("repwatchr.tracked");
        if (saved) {
          try {
            setTracked(JSON.parse(saved) as TrackedItem[]);
          } catch {
            setTracked(defaultTracked);
          }
        }
        return;
      }

      const { data, error } = await supabase
        .from("member_tracked_items")
        .select("id, label, href, item_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setBackendStatus("Local fallback until member tables are installed");
        return;
      }

      const rows = (data ?? []).map((item) => ({
        id: item.id as string,
        label: item.label as string,
        href: item.href as string,
        type: item.item_type as TrackedItem["type"],
      }));

      setTracked(rows.length ? rows : defaultTracked);
      setBackendStatus("Saved to your RepWatchr account");
    }

    loadTrackedItems();
  }, [supabase, user]);

  useEffect(() => {
    if (!user) {
      try {
        window.localStorage.setItem("repwatchr.tracked", JSON.stringify(tracked));
      } catch {
        setBackendStatus("Local save unavailable in this browser");
      }
    }
  }, [tracked, user]);

  const researchPath = useMemo(
    () => [
      "Search for the person, district, county, or race.",
      "Open the public profile and check sources, praise, flags, and gaps.",
      "Save the profile here so it stays in your watch list.",
      "Ask Gideon what record, meeting, filing, or source should be pulled next.",
    ],
    []
  );

  async function addTrackedItem(event: React.FormEvent) {
    event.preventDefault();
    const trimmedLabel = label.trim();
    const trimmedHref = href.trim() || `/search?q=${encodeURIComponent(trimmedLabel)}`;
    if (!trimmedLabel) return;

    const nextItem = { label: trimmedLabel, href: trimmedHref, type };

    if (user) {
      const { data, error } = await supabase
        .from("member_tracked_items")
        .insert({
          user_id: user.id,
          label: trimmedLabel,
          href: trimmedHref,
          item_type: type,
        })
        .select("id, label, href, item_type")
        .single();

      if (!error && data) {
        setTracked((current) => [
          { id: data.id as string, label: data.label as string, href: data.href as string, type: data.item_type as TrackedItem["type"] },
          ...current.filter((item) => item.label !== trimmedLabel),
        ]);
        setBackendStatus("Saved to your RepWatchr account");
      } else {
        setTracked((current) => [nextItem, ...current]);
        setBackendStatus("Local fallback until member tables are installed");
      }
    } else {
      setTracked((current) => [nextItem, ...current]);
    }

    setLabel("");
    setHref("");
    setType("official");
  }

  async function removeTrackedItem(item: TrackedItem) {
    setTracked((current) => current.filter((trackedItem) => trackedItem !== item));
    if (user && item.id) {
      await supabase.from("member_tracked_items").delete().eq("id", item.id).eq("user_id", user.id);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Member watch list</p>
          <h2 className="mt-2 text-2xl font-black text-gray-950">Who you are tracking</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">
            Save officials, school boards, county races, or research targets. {backendStatus}.
          </p>
          <form onSubmit={addTrackedItem} className="mt-5 grid gap-3">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Name, race, school, county, or district"
              className="rounded-xl border border-gray-200 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={href}
                onChange={(event) => setHref(event.target.value)}
                placeholder="/officials or /school-boards..."
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as TrackedItem["type"])}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="official">Official</option>
                <option value="school_board">School board</option>
                <option value="county">County</option>
                <option value="race">Race</option>
                <option value="research">Research</option>
              </select>
              <button className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
                Track
              </button>
            </div>
          </form>
          <div className="mt-5 grid gap-3">
            {tracked.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-black text-gray-950">{item.label}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                    {item.type.replace("_", " ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={item.href} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm hover:text-red-700">
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeTrackedItem(item)}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-black text-gray-500 shadow-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-[#f7fbff] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Watch map</p>
          <h2 className="mt-2 text-2xl font-black text-gray-950">Start broad, then drill down.</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {mapZones.map((zone) => (
              <Link key={zone.label} href={zone.href} className={`grid min-h-24 place-items-center rounded-2xl p-3 text-center text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${zone.tone}`}>
                {zone.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-5">
            <p className="text-sm font-black text-blue-950">Research path</p>
            <ol className="mt-3 space-y-2 text-sm font-semibold leading-6 text-gray-700">
              {researchPath.map((step, index) => (
                <li key={step}>
                  <span className="mr-2 font-black text-red-700">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <GideonConsole />
    </div>
  );
}
