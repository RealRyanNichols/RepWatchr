"use client";

import { useMemo, useState, type FormEvent } from "react";
import ReferralStatsPanel from "@/components/referrals/ReferralStatsPanel";
import { findUnsafeShareCopy, shareCampaignTypes } from "@/lib/referral-share-campaigns";

export type AdminShareCampaign = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  default_share_text: string | null;
  target_route: string | null;
};

export type AdminShareAsset = {
  id: string;
  title: string | null;
  asset_type: string;
  copy_text: string | null;
  url: string | null;
  status: string;
};

export type AdminShareCampaignData = {
  campaigns: AdminShareCampaign[];
  assets: AdminShareAsset[];
  stats: {
    referralCodes: number;
    referralEvents: number;
    visits: number;
    conversions: number;
    activeCampaigns: number;
    activeAssets: number;
  };
  topRoutes: Array<{ route: string; count: number }>;
};

type AdminShareCampaignManagerProps = {
  initialData: AdminShareCampaignData;
};

async function postAdminAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/share-campaigns", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Admin share campaign action failed.");
  }
  return data;
}

export default function AdminShareCampaignManager({ initialData }: AdminShareCampaignManagerProps) {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const unsafeCampaigns = useMemo(
    () =>
      data.campaigns
        .map((campaign) => ({
          campaign,
          findings: findUnsafeShareCopy(campaign.default_share_text || ""),
        }))
        .filter((item) => item.findings.length),
    [data.campaigns],
  );

  async function refresh() {
    const response = await fetch("/api/admin/share-campaigns", { cache: "no-store" });
    const next = await response.json();
    if (next?.ok) setData(next.data);
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postAdminAction({
        action: "create_campaign",
        key: form.get("key"),
        name: form.get("name"),
        description: form.get("description"),
        campaignType: form.get("campaign_type"),
        defaultShareText: form.get("default_share_text"),
        targetRoute: form.get("target_route"),
      });
      event.currentTarget.reset();
      setMessage("Campaign saved.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Campaign save failed.");
    }
  }

  async function editCampaign(event: FormEvent<HTMLFormElement>, campaignId: string) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await postAdminAction({
        action: "update_campaign_copy",
        campaignId,
        key: form.get("key"),
        name: form.get("name"),
        description: form.get("description"),
        campaignType: form.get("campaign_type"),
        defaultShareText: form.get("default_share_text"),
        targetRoute: form.get("target_route"),
      });
      setMessage("Campaign copy updated.");
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Campaign update failed.");
    }
  }

  async function updateStatus(campaignId: string, status: string) {
    setError("");
    setMessage("");
    try {
      await postAdminAction({ action: "update_campaign_status", campaignId, status });
      setMessage(`Campaign ${status}.`);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Status update failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <ReferralStatsPanel stats={data.stats} />

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-950">{error}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Create campaign</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Safe share campaign</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Campaigns create opt-in share prompts and referral links. They do not send messages.
        </p>
        <form onSubmit={createCampaign} className="mt-4 grid gap-3 lg:grid-cols-2">
          <Field name="key" label="Key" required placeholder="county-hub-nacogdoches" />
          <Field name="name" label="Name" required placeholder="Nacogdoches county hub share" />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Campaign type
            <select name="campaign_type" className="field">
              {shareCampaignTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Field name="target_route" label="Route" placeholder="/states/texas/counties/nacogdoches" />
          <label className="grid gap-1 text-sm font-bold text-slate-700 lg:col-span-2">
            Description
            <textarea name="description" rows={3} className="field" placeholder="What this share campaign is for." />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700 lg:col-span-2">
            Default share text
            <textarea name="default_share_text" rows={4} required className="field" placeholder="Safe public-record share copy." />
          </label>
          <button type="submit" className="primary-button lg:col-span-2">Save campaign</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Campaigns</p>
        <div className="mt-4 grid gap-3">
          {data.campaigns.map((campaign) => (
            <article key={campaign.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {campaign.campaign_type.replaceAll("_", " ")} / {campaign.status}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{campaign.name}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{campaign.description || "No description yet."}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-blue-950">{campaign.default_share_text}</p>
                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-slate-600">
                      Edit copy
                    </summary>
                    <form onSubmit={(event) => editCampaign(event, campaign.id)} className="mt-3 grid gap-3">
                      <input type="hidden" name="key" value={campaign.key} />
                      <Field name="name" label="Name" required placeholder="Campaign name" defaultValue={campaign.name} />
                      <label className="grid gap-1 text-sm font-bold text-slate-700">
                        Campaign type
                        <select name="campaign_type" defaultValue={campaign.campaign_type} className="field">
                          {shareCampaignTypes.map((type) => (
                            <option key={type} value={type}>
                              {type.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Field name="target_route" label="Route" placeholder="/officials" defaultValue={campaign.target_route || ""} />
                      <label className="grid gap-1 text-sm font-bold text-slate-700">
                        Description
                        <textarea name="description" rows={2} defaultValue={campaign.description || ""} className="field" />
                      </label>
                      <label className="grid gap-1 text-sm font-bold text-slate-700">
                        Default share text
                        <textarea name="default_share_text" rows={3} defaultValue={campaign.default_share_text || ""} required className="field" />
                      </label>
                      <button type="submit" className="secondary-button">Save copy</button>
                    </form>
                  </details>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="secondary-button" onClick={() => updateStatus(campaign.id, campaign.status === "active" ? "paused" : "active")}>
                    {campaign.status === "active" ? "Pause" : "Activate"}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => updateStatus(campaign.id, "archived")}>
                    Archive
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Top shared routes</p>
          <div className="mt-4 grid gap-2">
            {data.topRoutes.length ? (
              data.topRoutes.map((route) => (
                <div key={route.route} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="break-all text-sm font-bold text-slate-700">{route.route}</span>
                  <span className="font-black text-slate-950">{route.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold leading-6 text-slate-600">No referral route events yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Unsafe copy audit</p>
          <div className="mt-4 grid gap-2">
            {unsafeCampaigns.length ? (
              unsafeCampaigns.map(({ campaign, findings }) => (
                <div key={campaign.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950">
                  {campaign.name}: {findings.map((finding) => finding.term).join(", ")}
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold leading-6 text-slate-600">No unsafe default share copy detected.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  required = false,
  placeholder = "",
  defaultValue = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} className="field" />
    </label>
  );
}
