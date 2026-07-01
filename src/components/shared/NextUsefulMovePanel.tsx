"use client";

import { useState } from "react";
import Link from "next/link";

const safeShareLine =
  "RepWatchr check: open the public record, read the receipt, and submit a better source if something is missing.";

type BaseMove = {
  label: string;
  eyebrow: string;
  detail: string;
  mark: string;
  actionLabel: string;
  shell: string;
  icon: string;
  pill: string;
};

type LinkMove = BaseMove & {
  kind: "link";
  href: string;
};

type CopyMove = BaseMove & {
  kind: "copy";
  copyText: string;
};

type NextUsefulMove = LinkMove | CopyMove;

const nextUsefulMoves: NextUsefulMove[] = [
  {
    kind: "link",
    label: "Watch this record",
    eyebrow: "Track",
    detail: "Open the officials directory and pick the profile you want to follow.",
    href: "/officials",
    mark: "WATCH",
    actionLabel: "Open ->",
    shell: "border-red-300 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_48%,#eef6ff_100%)] text-blue-950 shadow-red-900/10",
    icon: "bg-red-700 text-white",
    pill: "bg-red-700 text-white",
  },
  {
    kind: "link",
    label: "Submit one source",
    eyebrow: "Source",
    detail: "Send the link, filing, clip, agenda, vote, or correction that proves the record.",
    href: "/submit-source",
    mark: "SRC",
    actionLabel: "Send ->",
    shell: "border-amber-300 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eef6ff_100%)] text-blue-950 shadow-amber-900/10",
    icon: "bg-amber-400 text-blue-950",
    pill: "bg-amber-400 text-blue-950",
  },
  {
    kind: "copy",
    label: "Copy safe line",
    eyebrow: "Share",
    detail: "Copy a cautious source-first line before posting claims, questions, or meeting comments.",
    mark: "COPY",
    actionLabel: "Copy ->",
    shell: "border-blue-300 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_50%,#fff7ed_100%)] text-blue-950 shadow-blue-900/10",
    icon: "bg-blue-900 text-white",
    pill: "bg-blue-900 text-white",
    copyText: safeShareLine,
  },
  {
    kind: "link",
    label: "Build source packet",
    eyebrow: "Packet",
    detail: "Turn a race, official, filing, or public question into a clean packet.",
    href: "/elections/texas/contribute",
    mark: "PACK",
    actionLabel: "Open ->",
    shell: "border-slate-700 bg-[linear-gradient(135deg,#020617_0%,#0b2a55_100%)] text-white shadow-slate-950/20",
    icon: "bg-white/10 text-white ring-1 ring-white/20",
    pill: "bg-white text-blue-950",
  },
];

function CardContents({
  move,
  copied,
}: {
  move: NextUsefulMove;
  copied?: boolean;
}) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl text-[10px] font-black uppercase tracking-wide shadow-sm ${move.icon}`}>
          {move.mark}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${move.pill}`}>
          {copied ? "Copied" : move.actionLabel}
        </span>
      </span>
      <span className="mt-4 block text-[11px] font-black uppercase tracking-[0.18em] text-red-700 group-hover:text-red-600">
        {move.eyebrow}
      </span>
      <span className="mt-1 block text-left text-lg font-black leading-tight">
        {move.label}
      </span>
      <span className="mt-2 block text-left text-sm font-bold leading-5 opacity-80">
        {move.detail}
      </span>
    </>
  );
}

export default function NextUsefulMovePanel() {
  const [copied, setCopied] = useState(false);

  async function copySafeLine() {
    try {
      await navigator.clipboard.writeText(safeShareLine);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="border-b border-blue-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef6ff_58%,#fff7ed_100%)] p-4 shadow-xl shadow-blue-950/10 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">
                Your next useful move
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-blue-950 sm:text-3xl">
                Pick the action that adds a receipt.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-bold leading-6 text-slate-600">
              Watch the profile, submit the missing source, copy the safe line, or build the packet.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {nextUsefulMoves.map((move) => {
              const className = `rw-click-card group min-h-[138px] rounded-2xl border p-4 text-left shadow-xl transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${move.shell}`;

              if (move.kind === "copy") {
                return (
                  <button
                    key={move.label}
                    type="button"
                    onClick={copySafeLine}
                    className={className}
                    aria-label="Copy RepWatchr safe share line"
                  >
                    <CardContents move={move} copied={copied} />
                  </button>
                );
              }

              return (
                <Link
                  key={move.label}
                  href={move.href}
                  className={className}
                  aria-label={move.label}
                >
                  <CardContents move={move} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
