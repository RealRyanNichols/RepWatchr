"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type MemberProfile = {
  display_name: string | null;
  home_location: string | null;
  preferred_state: string | null;
  research_focus: string | null;
  public_profile_enabled: boolean | null;
};

export default function MemberProfilePanel() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [preferredState, setPreferredState] = useState("TX");
  const [researchFocus, setResearchFocus] = useState("");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      const { data } = await supabase
        .from("member_profiles")
        .select("display_name, home_location, preferred_state, research_focus, public_profile_enabled")
        .eq("user_id", user!.id)
        .maybeSingle();

      const profile = data as MemberProfile | null;
      if (!profile) return;
      setDisplayName(profile.display_name ?? "");
      setHomeLocation(profile.home_location ?? "");
      setPreferredState(profile.preferred_state ?? "TX");
      setResearchFocus(profile.research_focus ?? "");
      setPublicProfileEnabled(Boolean(profile.public_profile_enabled));
    }

    loadProfile();
  }, [supabase, user]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setStatus("");

    const { error } = await supabase.from("member_profiles").upsert(
      {
        user_id: user.id,
        display_name: displayName.trim() || null,
        home_location: homeLocation.trim() || null,
        preferred_state: preferredState.trim() || "TX",
        research_focus: researchFocus.trim() || null,
        public_profile_enabled: publicProfileEnabled,
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    setStatus(error ? `Profile could not be saved: ${error.message}` : "Profile saved.");
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Member profile</p>
          <h2 className="mt-1 text-2xl font-black text-gray-950">Who you are and what you watch</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-600">
            This powers your dashboard defaults and gives Gideon better context. The core website stays free.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
          Free account
        </span>
      </div>

      <form onSubmit={saveProfile} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-gray-700">
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Name shown inside your member area"
            className="rounded-xl border border-gray-200 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-gray-700">
          Home location
          <input
            value={homeLocation}
            onChange={(event) => setHomeLocation(event.target.value)}
            placeholder="County, city, district, or state"
            className="rounded-xl border border-gray-200 bg-blue-50/60 px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-gray-700">
          Default state
          <input
            value={preferredState}
            onChange={(event) => setPreferredState(event.target.value)}
            placeholder="TX"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-black text-gray-700">
          <input
            type="checkbox"
            checked={publicProfileEnabled}
            onChange={(event) => setPublicProfileEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Make a public member profile later
        </label>
        <label className="grid gap-1 text-sm font-black text-gray-700 lg:col-span-2">
          Research focus
          <textarea
            value={researchFocus}
            onChange={(event) => setResearchFocus(event.target.value)}
            rows={3}
            placeholder="Example: Harrison County school boards, county officials, city council races, parental-rights issues, campaign money..."
            className="resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:bg-blue-300"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {status ? <p className="text-sm font-bold text-gray-600">{status}</p> : null}
        </div>
      </form>
    </section>
  );
}
