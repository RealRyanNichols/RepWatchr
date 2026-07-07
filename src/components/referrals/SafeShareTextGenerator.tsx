"use client";

import { useMemo, useState } from "react";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import {
  findUnsafeShareCopy,
  generateSafeShareText,
  type SafeShareTemplateKind,
} from "@/lib/referral-share-campaigns";

type SafeShareTextGeneratorProps = {
  kind: SafeShareTemplateKind;
  subject: string;
  topic?: string;
  question?: string;
  url: string;
  compact?: boolean;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function SafeShareTextGenerator({
  kind,
  subject,
  topic,
  question,
  url,
  compact = false,
}: SafeShareTextGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const shareText = useMemo(
    () => generateSafeShareText({ kind, subject, topic, question, url }),
    [kind, question, subject, topic, url],
  );
  const unsafeFindings = useMemo(() => findUnsafeShareCopy(shareText), [shareText]);

  async function copyShareText() {
    const didCopy = await copyText(shareText);
    setCopied(didCopy);
    trackRepWatchrEvent("safe_share_text_copied", {
      share_kind: kind,
      route: typeof window !== "undefined" ? window.location.pathname : "",
      unsafe_flags: unsafeFindings.length,
    });
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={compact ? "rounded-lg border border-slate-200 bg-slate-50 p-3" : "rounded-xl border border-blue-100 bg-blue-50 p-4"}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-900">Safe share line</p>
          <p className="mt-1 text-sm font-bold leading-6 text-blue-950">{shareText}</p>
        </div>
        <button type="button" onClick={copyShareText} className="share-mini-button shrink-0">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {unsafeFindings.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          Admin copy warning: this line contains words that should be reviewed before reuse.
        </div>
      ) : null}
    </div>
  );
}
