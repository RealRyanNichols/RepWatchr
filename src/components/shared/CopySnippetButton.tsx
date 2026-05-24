"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

type CopySnippetButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
};

export default function CopySnippetButton({
  text,
  label = "Copy snippet",
  copiedLabel = "Copied",
}: CopySnippetButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      track("snippet_copy", { label });
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
