"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { trackRepWatchrEvent, type RepWatchrEventName } from "@/lib/client-analytics";

type CopySnippetButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  trackingEventName?: RepWatchrEventName;
  trackingMetadata?: Record<string, string | number | boolean | null | undefined>;
};

export default function CopySnippetButton({
  text,
  label = "Copy snippet",
  copiedLabel = "Copied",
  trackingEventName,
  trackingMetadata = {},
}: CopySnippetButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      track("snippet_copy", { label });
      if (trackingEventName) {
        trackRepWatchrEvent(trackingEventName, { label, ...trackingMetadata });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyText}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-800 transition hover:border-red-300 hover:bg-red-50"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
