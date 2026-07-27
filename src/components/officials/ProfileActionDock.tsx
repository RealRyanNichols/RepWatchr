"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileActionDockProps = {
  officialName: string;
  path: string;
  watchHref: string;
};

export default function ProfileActionDock({
  officialName,
  path,
  watchHref,
}: ProfileActionDockProps) {
  const [shareSupported, setShareSupported] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShareSupported(typeof navigator.share === "function"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function shareProfile() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (shareSupported) {
        await navigator.share({
          title: `${officialName} public record | RepWatchr`,
          text: `Inspect the source-linked public record for ${officialName}.`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // A cancelled native share is expected and does not need an error state.
    }
  }

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <Link
        href={watchHref}
        className="inline-flex min-h-10 items-center justify-center rounded-sm bg-white px-4 py-2 text-sm font-extrabold text-[#111b24] transition-colors hover:bg-[#f2dc99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
      >
        Follow profile
      </Link>
      <button
        type="button"
        onClick={shareProfile}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/35 bg-transparent px-4 py-2 text-sm font-extrabold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        aria-live="polite"
      >
        {copied ? "Link copied" : "Share record"}
      </button>
    </div>
  );
}
