"use client";

import { useEffect, useState } from "react";
import type { RepWatchrService } from "@/data/repwatchr-services";

type SavedServicePacket = {
  id: string;
  serviceSlug: string;
  serviceName: string;
  requesterEmail: string;
  target: string;
  createdAt: string;
  packet: string;
};

const storageKey = "repwatchr.serviceRequestPackets.v1";

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "repwatchr-service-request";
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function ServiceRequestPacketBuilder({ service }: { service: RepWatchrService }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [target, setTarget] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [packet, setPacket] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedPackets, setSavedPackets] = useState<SavedServicePacket[]>([]);

  useEffect(() => {
    let mounted = true;
    window.setTimeout(() => {
      if (!mounted) return;
      try {
        const stored = window.localStorage.getItem(storageKey);
        const parsed = stored ? (JSON.parse(stored) as SavedServicePacket[]) : [];
        setSavedPackets(Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.packet).slice(0, 15) : []);
      } catch {
        setSavedPackets([]);
      }
    }, 0);

    return () => {
      mounted = false;
    };
  }, []);

  const canBuild = target.trim() && summary.trim() && acknowledged;

  function buildPacket() {
    return [
      "RepWatchr Service Request Packet",
      "",
      `Service: ${service.name}`,
      `Price: ${service.priceLabel} / ${service.billingLabel}`,
      `Requester: ${name.trim() || "Not supplied"}`,
      `Email: ${email.trim() || "Not supplied"}`,
      `Jurisdiction: ${jurisdiction.trim() || "Not supplied"}`,
      `Target / race / issue: ${target.trim()}`,
      `Public source URL: ${sourceUrl.trim() || "Not supplied"}`,
      `Deadline: ${deadline.trim() || "Not supplied"}`,
      "",
      "What needs to be reviewed:",
      summary.trim(),
      "",
      "Service deliverables expected:",
      ...service.deliverables.map((item) => `- ${item}`),
      "",
      "Guardrail:",
      "This is a public-record research and organization request. It is not legal advice, private investigation, harassment, doxxing, or guaranteed publication.",
    ].join("\n");
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function persistPacket(value: string) {
    const saved: SavedServicePacket = {
      id: `${Date.now()}-${service.slug}`,
      serviceSlug: service.slug,
      serviceName: service.name,
      requesterEmail: email.trim(),
      target: target.trim(),
      createdAt: new Date().toISOString(),
      packet: value,
    };
    const nextPackets = [saved, ...savedPackets].slice(0, 15);
    setSavedPackets(nextPackets);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextPackets));
    } catch {
      // Visible packet remains available if storage is blocked.
    }
  }

  async function handleBuild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canBuild) return;
    const nextPacket = buildPacket();
    setPacket(nextPacket);
    setCopied(false);
    persistPacket(nextPacket);
    await copyText(nextPacket);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Request packet</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
          Start with the facts. Payment can come after scope is clear.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This builds a clean service request without Supabase. If a Stripe payment link is added later,
          the same service page can point straight to checkout.
        </p>
      </div>

      {packet ? (
        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">
            Service packet ready{copied ? " and copied." : "."}
          </p>
          <textarea
            readOnly
            value={packet}
            rows={10}
            className="mt-3 w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-900"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyText(packet)}
              className="rounded-xl bg-blue-950 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile(`${safeFileName(`${service.name}-${target}`)}.txt`, packet)}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
            >
              Download
            </button>
            <a
              href={`mailto:Ryan@RealRyanNichols.com?subject=${encodeURIComponent(`RepWatchr Service Request: ${service.name}`)}&body=${encodeURIComponent(packet)}`}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
            >
              Email
            </a>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleBuild} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Jurisdiction</span>
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              placeholder="Gregg County, TX-1, Longview ISD"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Target</span>
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              required
              placeholder="Official, race, board, issue, or filing"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Public source URL</span>
            <input
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Deadline</span>
            <input
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              placeholder="Election date, filing deadline, meeting date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">What needs to be reviewed</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            rows={5}
            maxLength={3000}
            placeholder="State the specific record, claim, race, or issue. Include dates, names, and source context where possible."
            className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm font-semibold leading-6 text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </label>
        <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-amber-500 text-blue-900 focus:ring-blue-800"
          />
          <span className="text-sm font-bold leading-6 text-amber-950">
            I understand this is public-record research and organization, not legal advice,
            private investigation, guaranteed publication, harassment, or doxxing.
          </span>
        </label>
        <button
          type="submit"
          disabled={!canBuild}
          className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          Build Request Packet
        </button>
      </form>

      {savedPackets.length ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Saved in this browser</p>
          <div className="mt-3 grid gap-2">
            {savedPackets.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-black text-blue-950">{item.target || item.serviceName}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  {item.serviceName} / {new Date(item.createdAt).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => copyText(item.packet)}
                  className="mt-2 rounded-lg bg-blue-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-700"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
