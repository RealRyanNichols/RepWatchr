"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  defaultWatchAlertPreferences,
  watchAlertLabels,
  watchAlertTypes,
  watchEntityLabels,
  watchEntityTypes,
  type WatchAlertType,
  type WatchEntityType,
} from "@/lib/member-watchlists";

type WatchlistItem = {
  id: string;
  watchlist_id: string;
  entity_type: WatchEntityType;
  entity_id: string | null;
  label: string;
  href: string | null;
  jurisdiction: string | null;
  source_context: string | null;
  notes: string | null;
  active: boolean;
};

type AlertPreference = {
  id?: string;
  watchlist_id: string;
  alert_type: WatchAlertType;
  enabled: boolean;
  delivery_channels?: string[] | null;
  minimum_severity?: string | null;
};

type AlertEvent = {
  id: string;
  watchlist_id: string;
  watchlist_item_id: string | null;
  alert_type: WatchAlertType;
  title: string;
  summary: string;
  href: string | null;
  severity: string;
  status: string;
  triggered_at: string;
};

type MemberWatchlist = {
  id: string;
  name: string;
  description: string | null;
  color: "blue" | "red" | "gold" | "green" | "slate";
  is_default: boolean;
  last_alert_at: string | null;
  last_digest_at: string | null;
  items: WatchlistItem[];
  alertPreferences: AlertPreference[];
  alerts: AlertEvent[];
};

const storageKey = "repwatchr.member.watchlists.v1";

const colorClasses: Record<MemberWatchlist["color"], string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  red: "border-red-200 bg-red-50 text-red-950",
  gold: "border-amber-200 bg-amber-50 text-amber-950",
  green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  slate: "border-slate-200 bg-slate-50 text-slate-950",
};

function localId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function seededWatchlist(): MemberWatchlist {
  const id = localId("watchlist");
  return {
    id,
    name: "My Civic Watch",
    description: "Officials, issues, filings, and records I want RepWatchr to keep in front of me.",
    color: "blue",
    is_default: true,
    last_alert_at: null,
    last_digest_at: null,
    items: [
      {
        id: localId("item"),
        watchlist_id: id,
        entity_type: "official",
        entity_id: null,
        label: "Texas officials",
        href: "/officials?state=TX",
        jurisdiction: "Texas",
        source_context: "Seed target",
        notes: "Replace this with the officials, races, boards, courts, donors, or agencies you want to follow.",
        active: true,
      },
    ],
    alertPreferences: defaultWatchAlertPreferences.map((preference) => ({
      watchlist_id: id,
      alert_type: preference.alertType,
      enabled: preference.enabled,
      delivery_channels: ["in_app"],
      minimum_severity: "normal",
    })),
    alerts: [],
  };
}

function readLocalWatchlists() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as MemberWatchlist[]) : [seededWatchlist()];
  } catch {
    return [seededWatchlist()];
  }
}

function writeLocalWatchlists(watchlists: MemberWatchlist[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(watchlists));
  } catch {
    // Local fallback is best effort only.
  }
}

function alertEnabled(watchlist: MemberWatchlist, alertType: WatchAlertType) {
  return watchlist.alertPreferences.find((preference) => preference.alert_type === alertType)?.enabled ?? false;
}

function normalizeWatchlist(data: unknown): MemberWatchlist[] {
  if (!Array.isArray(data)) return [];
  return data.map((watchlist) => {
    const row = watchlist as Partial<MemberWatchlist>;
    const id = String(row.id ?? localId("watchlist"));
    return {
      id,
      name: String(row.name ?? "Untitled Watchlist"),
      description: row.description ?? null,
      color: row.color ?? "blue",
      is_default: Boolean(row.is_default),
      last_alert_at: row.last_alert_at ?? null,
      last_digest_at: row.last_digest_at ?? null,
      items: Array.isArray(row.items) ? row.items : [],
      alertPreferences: Array.isArray(row.alertPreferences)
        ? row.alertPreferences
        : defaultWatchAlertPreferences.map((preference) => ({
            watchlist_id: id,
            alert_type: preference.alertType,
            enabled: preference.enabled,
          })),
      alerts: Array.isArray(row.alerts) ? row.alerts : [],
    };
  });
}

export default function MemberWatchlistOffice() {
  const { user } = useAuth();
  const [watchlists, setWatchlists] = useState<MemberWatchlist[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Loading watchlists");
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listColor, setListColor] = useState<MemberWatchlist["color"]>("blue");
  const [itemLabel, setItemLabel] = useState("");
  const [itemHref, setItemHref] = useState("");
  const [itemJurisdiction, setItemJurisdiction] = useState("");
  const [itemType, setItemType] = useState<WatchEntityType>("official");

  useEffect(() => {
    let mounted = true;

    async function loadWatchlists() {
      if (!user) {
        const local = readLocalWatchlists();
        if (!mounted) return;
        setWatchlists(local);
        setSelectedId(local[0]?.id ?? "");
        setStatus("Local until login");
        return;
      }

      try {
        const response = await fetch("/api/member/watchlists", { cache: "no-store" });
        const result = (await response.json()) as { ok?: boolean; watchlists?: unknown; error?: string };
        if (!mounted) return;

        if (!response.ok || !result.ok) {
          const local = readLocalWatchlists();
          setWatchlists(local);
          setSelectedId(local[0]?.id ?? "");
          setStatus(result.error ?? "Local fallback until watchlist tables are installed");
          return;
        }

        const rows = normalizeWatchlist(result.watchlists);
        const nextRows = rows.length ? rows : [seededWatchlist()];
        setWatchlists(nextRows);
        setSelectedId(nextRows[0]?.id ?? "");
        setStatus(rows.length ? "Synced to member_watchlists" : "Create your first saved watchlist");
      } catch {
        const local = readLocalWatchlists();
        if (!mounted) return;
        setWatchlists(local);
        setSelectedId(local[0]?.id ?? "");
        setStatus("Local fallback until watchlist API is reachable");
      }
    }

    void loadWatchlists();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user && watchlists.length) writeLocalWatchlists(watchlists);
  }, [user, watchlists]);

  const selected = useMemo(
    () => watchlists.find((watchlist) => watchlist.id === selectedId) ?? watchlists[0],
    [selectedId, watchlists],
  );

  const totals = useMemo(() => {
    const itemCount = watchlists.reduce((sum, watchlist) => sum + watchlist.items.length, 0);
    const alertCount = watchlists.reduce(
      (sum, watchlist) => sum + watchlist.alertPreferences.filter((preference) => preference.enabled).length,
      0,
    );
    const unreadCount = watchlists.reduce(
      (sum, watchlist) => sum + watchlist.alerts.filter((alert) => alert.status === "unread").length,
      0,
    );
    return { itemCount, alertCount, unreadCount };
  }, [watchlists]);

  async function createWatchlist(event: FormEvent) {
    event.preventDefault();
    const name = listName.trim();
    if (!name) return;

    if (user) {
      try {
        const response = await fetch("/api/member/watchlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: listDescription, color: listColor }),
        });
        const result = (await response.json()) as { ok?: boolean; watchlist?: MemberWatchlist; error?: string };
        if (response.ok && result.ok && result.watchlist) {
          setWatchlists((current) => [result.watchlist!, ...current]);
          setSelectedId(result.watchlist.id);
          setStatus("Watchlist saved");
          setListName("");
          setListDescription("");
          return;
        }
        setStatus(result.error ?? "Could not save watchlist yet");
      } catch {
        setStatus("Local fallback until watchlist API is reachable");
      }
    }

    const id = localId("watchlist");
    const localWatchlist: MemberWatchlist = {
      id,
      name,
      description: listDescription.trim() || null,
      color: listColor,
      is_default: false,
      last_alert_at: null,
      last_digest_at: null,
      items: [],
      alertPreferences: defaultWatchAlertPreferences.map((preference) => ({
        watchlist_id: id,
        alert_type: preference.alertType,
        enabled: preference.enabled,
      })),
      alerts: [],
    };
    setWatchlists((current) => [localWatchlist, ...current]);
    setSelectedId(id);
    setListName("");
    setListDescription("");
  }

  async function addItem(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const label = itemLabel.trim();
    if (!label) return;

    if (user) {
      try {
        const response = await fetch("/api/member/watchlists/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchlistId: selected.id,
            entityType: itemType,
            label,
            href: itemHref,
            jurisdiction: itemJurisdiction,
          }),
        });
        const result = (await response.json()) as { ok?: boolean; item?: WatchlistItem; error?: string };
        if (response.ok && result.ok && result.item) {
          setWatchlists((current) =>
            current.map((watchlist) =>
              watchlist.id === selected.id ? { ...watchlist, items: [result.item!, ...watchlist.items] } : watchlist,
            ),
          );
          setStatus("Target added to watchlist");
          setItemLabel("");
          setItemHref("");
          setItemJurisdiction("");
          return;
        }
        setStatus(result.error ?? "Could not save watched target yet");
      } catch {
        setStatus("Local fallback until watchlist API is reachable");
      }
    }

    const localItem: WatchlistItem = {
      id: localId("item"),
      watchlist_id: selected.id,
      entity_type: itemType,
      entity_id: null,
      label,
      href: itemHref.trim() || null,
      jurisdiction: itemJurisdiction.trim() || null,
      source_context: "Member-added target",
      notes: null,
      active: true,
    };

    setWatchlists((current) =>
      current.map((watchlist) =>
        watchlist.id === selected.id ? { ...watchlist, items: [localItem, ...watchlist.items] } : watchlist,
      ),
    );
    setItemLabel("");
    setItemHref("");
    setItemJurisdiction("");
  }

  async function toggleAlert(alertType: WatchAlertType) {
    if (!selected) return;
    const nextPreferences = watchAlertTypes.map((type) => ({
      alertType: type,
      enabled: type === alertType ? !alertEnabled(selected, type) : alertEnabled(selected, type),
    }));

    setWatchlists((current) =>
      current.map((watchlist) =>
        watchlist.id === selected.id
          ? {
              ...watchlist,
              alertPreferences: nextPreferences.map((preference) => ({
                watchlist_id: selected.id,
                alert_type: preference.alertType,
                enabled: preference.enabled,
              })),
            }
          : watchlist,
      ),
    );

    if (!user) return;

    try {
      const response = await fetch("/api/member/watchlists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, alertPreferences: nextPreferences }),
      });
      const result = (await response.json()) as { ok?: boolean; watchlists?: unknown; error?: string };
      if (response.ok && result.ok) {
        const rows = normalizeWatchlist(result.watchlists);
        if (rows.length) setWatchlists(rows);
        setStatus("Alert rules updated");
      } else {
        setStatus(result.error ?? "Alert rule saved locally until database is ready");
      }
    } catch {
      setStatus("Alert rule saved locally until API is reachable");
    }
  }

  async function removeItem(item: WatchlistItem) {
    if (!selected) return;
    setWatchlists((current) =>
      current.map((watchlist) =>
        watchlist.id === selected.id
          ? { ...watchlist, items: watchlist.items.filter((candidate) => candidate.id !== item.id) }
          : watchlist,
      ),
    );

    if (!user) return;
    await fetch(`/api/member/watchlists/items?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }).catch(() => null);
  }

  return (
    <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Unlimited watchlists</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">Every watched record is a return hook.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Watch officials, cities, school boards, issues, bills, campaigns, donors, PACs, commissioners, agencies, courts, and judges.
            Each list can fire daily digests, weekly digests, major vote alerts, new funding, new sources, new articles, corrections, meetings, and filings.
          </p>
        </div>
        <Link
          href="/dashboard/watchlists"
          className="rounded-xl bg-blue-950 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
        >
          Full Watch Office
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Watchlists" value={watchlists.length} />
        <Metric label="Watched records" value={totals.itemCount} />
        <Metric label="Enabled alerts" value={totals.alertCount} detail={`${totals.unreadCount} unread`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <form onSubmit={createWatchlist} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-800">Create a list</p>
            <input
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder="Example: Bowie County 2026"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={listDescription}
              onChange={(event) => setListDescription(event.target.value)}
              placeholder="What should this list watch?"
              rows={3}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={listColor}
                onChange={(event) => setListColor(event.target.value as MemberWatchlist["color"])}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="blue">Blue</option>
                <option value="red">Red</option>
                <option value="gold">Gold</option>
                <option value="green">Green</option>
                <option value="slate">Slate</option>
              </select>
              <button className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-950">
                Create
              </button>
            </div>
          </form>

          <div className="grid gap-2">
            {watchlists.map((watchlist) => (
              <button
                key={watchlist.id}
                type="button"
                onClick={() => setSelectedId(watchlist.id)}
                className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${colorClasses[watchlist.color]} ${
                  selected?.id === watchlist.id ? "ring-2 ring-blue-700" : ""
                }`}
              >
                <p className="text-sm font-black">{watchlist.name}</p>
                <p className="mt-1 text-xs font-bold opacity-75">
                  {watchlist.items.length} watched / {watchlist.alertPreferences.filter((preference) => preference.enabled).length} alerts on
                </p>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-800">Selected watchlist</p>
                  <h3 className="mt-1 text-2xl font-black text-blue-950">{selected.name}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-blue-950/70">{selected.description || status}</p>
                </div>
                <p className="rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-900 shadow-sm">
                  {status}
                </p>
              </div>
            </div>

            <form onSubmit={addItem} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Add watched target</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={itemLabel}
                  onChange={(event) => setItemLabel(event.target.value)}
                  placeholder="Name, bill, donor, court, agency..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={itemType}
                  onChange={(event) => setItemType(event.target.value as WatchEntityType)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {watchEntityTypes.map((type) => (
                    <option key={type} value={type}>
                      {watchEntityLabels[type]}
                    </option>
                  ))}
                </select>
                <input
                  value={itemHref}
                  onChange={(event) => setItemHref(event.target.value)}
                  placeholder="/officials/ted-cruz or source URL"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <input
                  value={itemJurisdiction}
                  onChange={(event) => setItemJurisdiction(event.target.value)}
                  placeholder="Texas, county, city, district..."
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button className="mt-3 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700">
                Watch This Record
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-800">Return triggers</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {watchAlertTypes.map((alertType) => (
                  <button
                    key={alertType}
                    type="button"
                    onClick={() => void toggleAlert(alertType)}
                    className={`rounded-xl border px-3 py-3 text-left text-xs font-black uppercase tracking-wide transition ${
                      alertEnabled(selected, alertType)
                        ? "border-blue-300 bg-blue-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {watchAlertLabels[alertType]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Watched records</p>
              <div className="mt-3 grid gap-3">
                {selected.items.length ? (
                  selected.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-950">{item.label}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {watchEntityLabels[item.entity_type]} {item.jurisdiction ? `/ ${item.jurisdiction}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {item.href ? (
                          <Link href={item.href} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm hover:text-red-700">
                            Open
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void removeItem(item)}
                          className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                    No watched targets yet. Add one official, agency, donor, court, campaign, or issue to give this list something to monitor.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-slate-600">{detail}</p> : null}
    </div>
  );
}
