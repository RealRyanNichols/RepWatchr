"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileActionDockProps = {
  officialName: string;
  path: string;
  watchHref: string;
  contactHref?: string;
};

export default function ProfileActionDock({
  officialName,
  path,
  watchHref,
  contactHref,
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
    <div className="flex flex-wrap gap-2.5">
      <Link
        href={watchHref}
        className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_14px_36px_rgba(2,6,23,0.28)] transition hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Watch profile
      </Link>
      <button
        type="button"
        onClick={shareProfile}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-black text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-live="polite"
      >
        {copied ? "Link copied" : shareSupported ? "Share profile" : "Copy profile link"}
      </button>
      {contactHref ? (
        <a
          href={contactHref}
          target={contactHref.startsWith("http") ? "_blank" : undefined}
          rel={contactHref.startsWith("http") ? "noopener noreferrer" : undefined}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:border-white/45 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Contact office
        </a>
      ) : null}
    </div>
  );
}
