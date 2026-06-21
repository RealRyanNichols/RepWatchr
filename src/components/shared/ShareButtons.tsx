"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import {
  buildRepWatchrShareKit,
  canonicalShareUrl,
  type ShareTemplateKind,
} from "@/lib/share-snippets";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

interface ShareButtonsProps {
  title: string;
  description?: string;
  path: string;
  template?: ShareTemplateKind;
  subject?: string;
  sourceLabel?: string;
  className?: string;
}

type ShareEventName =
  | "share_copy_clicked"
  | "native_share_clicked"
  | "social_share_clicked"
  | "source_snippet_copied"
  | "profile_watch_clicked";

function socialUrl(channel: "x" | "facebook" | "linkedin", url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  if (channel === "x") return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  if (channel === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
}

export default function ShareButtons({
  title,
  description,
  path,
  template,
  subject,
  sourceLabel,
  className = "",
}: ShareButtonsProps) {
  const [copiedKey, setCopiedKey] = useState("");
  const [nativeShareSupported, setNativeShareSupported] = useState(false);

  const kit = useMemo(
    () => buildRepWatchrShareKit({ title, description, path, template, subject, sourceLabel }),
    [description, path, sourceLabel, subject, template, title],
  );
  const cleanUrl = canonicalShareUrl(path);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNativeShareSupported(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function recordShareEvent(eventName: ShareEventName, channel: string, extra: Record<string, string> = {}) {
    track(eventName, {
      channel,
      path,
      template: kit.template,
      ...extra,
    });
    trackRepWatchrEvent(eventName, {
      channel,
      path,
      template: kit.template,
      ...extra,
    });
    fetch("/api/analytics/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventName,
        channel,
        path,
        template: kit.template,
        title,
        ...extra,
      }),
      keepalive: true,
    }).catch(() => {
      // Share persistence is best-effort; Vercel Analytics still records the action.
    });
  }

  async function copyValue(key: string, value: string, eventName: ShareEventName, channel: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      recordShareEvent(eventName, channel, { snippetType: key });
      window.setTimeout(() => setCopiedKey((current) => (current === key ? "" : current)), 1800);
    } catch {
      setCopiedKey("");
    }
  }

  async function nativeShare() {
    if (!nativeShareSupported) return;
    try {
      await navigator.share({
        title,
        text: kit.snippet,
        url: cleanUrl,
      });
      recordShareEvent("native_share_clicked", "native");
    } catch {
      // User cancellation is normal.
    }
  }

  function onSocialClick(channel: "x" | "facebook" | "linkedin") {
    recordShareEvent("social_share_clicked", channel);
  }

  function onWatchClick() {
    recordShareEvent("profile_watch_clicked", "watch_record");
  }

  return (
    <section className={`w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">{kit.label}</p>
          <p className="mt-1 text-sm font-black leading-5 text-blue-950">Share the receipt, not just the outrage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyValue("clean_link", cleanUrl, "share_copy_clicked", "copy")}
            className="share-action-button"
          >
            {copiedKey === "clean_link" ? "Link copied" : "Copy link"}
          </button>
          {nativeShareSupported ? (
            <button type="button" onClick={nativeShare} className="share-action-button">
              Native share
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-900">Source-backed snippet</p>
          <button
            type="button"
            onClick={() => copyValue("source_snippet", kit.snippet, "source_snippet_copied", "snippet")}
            className="share-mini-button"
          >
            {copiedKey === "source_snippet" ? "Copied" : "Copy snippet"}
          </button>
        </div>
        <p className="mt-2 text-sm font-bold leading-6 text-blue-950">{kit.snippet}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SnippetCopyCard
          label="Before the meeting"
          text={kit.talkingPoint}
          copied={copiedKey === "talking_point"}
          onCopy={() => copyValue("talking_point", kit.talkingPoint, "source_snippet_copied", "talking_point")}
        />
        <SnippetCopyCard
          label="Ask this public question"
          text={kit.publicQuestion}
          copied={copiedKey === "public_question"}
          onCopy={() => copyValue("public_question", kit.publicQuestion, "source_snippet_copied", "public_question")}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["x", "facebook", "linkedin"] as const).map((channel) => (
            <a
              key={channel}
              href={socialUrl(channel, cleanUrl, kit.snippet)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSocialClick(channel)}
              className="share-social-link"
            >
              {channel === "x" ? "X" : channel === "facebook" ? "Facebook" : "LinkedIn"}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={kit.submitSourceHref} className="share-secondary-link">
            Submit a better source
          </Link>
          <Link href={kit.watchHref} onClick={onWatchClick} className="share-primary-link">
            Watch this record
          </Link>
        </div>
      </div>
    </section>
  );
}

function SnippetCopyCard({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</p>
        <button type="button" onClick={onCopy} className="share-mini-button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{text}</p>
    </div>
  );
}
