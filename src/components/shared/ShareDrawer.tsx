"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics-client";
import { absoluteUrl } from "@/lib/seo";
import { getDefaultPublicQuestion, getSafeShareLine, type ShareSnippetKind } from "@/lib/share-snippets";

type ShareDrawerProps = {
  title: string;
  path: string;
  entityName?: string;
  description?: string;
  sourceUrl?: string;
  sourcePacket?: string;
  publicQuestion?: string;
  meetingQuestion?: string;
  snippetKind?: ShareSnippetKind;
  submitSourcePath?: string;
  correctionPath?: string;
};

export default function ShareDrawer({
  title,
  path,
  entityName,
  description,
  sourceUrl,
  sourcePacket,
  publicQuestion,
  meetingQuestion,
  snippetKind = "watch_profile",
  submitSourcePath = "/submit-source",
  correctionPath = "/sources/submit?type=correction_request",
}: ShareDrawerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const url = absoluteUrl(path);
  const name = entityName || title;
  const question = publicQuestion || getDefaultPublicQuestion(name);
  const safeShareLine = useMemo(
    () =>
      getSafeShareLine({
        kind: snippetKind,
        name,
        fact: description,
        topic: description,
        question,
        path,
        sourceUrl,
      }),
    [description, name, path, question, snippetKind, sourceUrl],
  );
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(safeShareLine);

  async function copy(label: string, value: string, eventName: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    void trackEvent(eventName, { title, path, label }, { route: path });
    setTimeout(() => setCopied(""), 1700);
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copy("link", url, "share_copy_link");
      return;
    }
    await navigator.share({ title, text: safeShareLine, url });
    void trackEvent("native_share_clicked", { title, path }, { route: path });
  }

  function openDrawer() {
    setOpen(true);
    void trackEvent("share_menu_open", { title, path }, { route: path });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={openDrawer}
        className="w-full rounded-xl bg-blue-950 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
      >
        Share the receipt
      </button>

      {open ? (
        <div className="mt-4 grid gap-3">
          <ShareSnippetPreview text={safeShareLine} />
          <div className="grid gap-2 sm:grid-cols-2">
            <ShareButton label={copied === "link" ? "Copied" : "Copy link"} onClick={() => copy("link", url, "share_copy_link")} />
            <ShareButton label="Native share" onClick={nativeShare} />
            <a className="share-action" href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" onClick={() => void trackEvent("social_share_clicked", { channel: "x", path }, { route: path })}>X share</a>
            <a className="share-action" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" onClick={() => void trackEvent("social_share_clicked", { channel: "facebook", path }, { route: path })}>Facebook</a>
            <a className="share-action" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" onClick={() => void trackEvent("social_share_clicked", { channel: "linkedin", path }, { route: path })}>LinkedIn</a>
            <a className="share-action" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`} onClick={() => void trackEvent("social_share_clicked", { channel: "email", path }, { route: path })}>Email</a>
            <ShareButton label={copied === "snippet" ? "Copied" : "Copy safe line"} onClick={() => copy("snippet", safeShareLine, "share_copy_snippet")} />
            <ShareButton label={copied === "question" ? "Copied" : "Copy public question"} onClick={() => copy("question", question, "public_question_copied")} />
            {sourcePacket ? <ShareButton label={copied === "packet" ? "Copied" : "Copy source packet"} onClick={() => copy("packet", sourcePacket, "source_snippet_copied")} /> : null}
            {meetingQuestion ? <ShareButton label={copied === "meeting" ? "Copied" : "Copy meeting question"} onClick={() => copy("meeting", meetingQuestion, "public_question_copied")} /> : null}
            <a className="share-action" href={submitSourcePath}>Submit source</a>
            <a className="share-action" href={correctionPath}>Request correction</a>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-xs font-black uppercase tracking-wide text-slate-500 hover:text-red-700">
            Close share tools
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ShareButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="share-action">
      {label}
    </button>
  );
}

export function ShareSnippetPreview({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-950">
      {text}
    </div>
  );
}

export function OGPreviewCard({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <img src={imageUrl} alt={`${title} social preview`} className="aspect-[1200/630] w-full object-cover" />
      <div className="p-3 text-sm font-black text-blue-950">{title}</div>
    </div>
  );
}

export function CopySafeShareLineButton({
  text,
  title = "Share line",
  path = "/",
  label = "Copy safe share line",
}: {
  text: string;
  title?: string;
  path?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    void trackEvent("share_copy_snippet", { title, path }, { route: path });
    setTimeout(() => setCopied(false), 1700);
  }

  return (
    <button type="button" onClick={handleCopy} className="share-action">
      {copied ? "Copied" : label}
    </button>
  );
}

export function CopyPublicQuestionButton({
  question,
  title = "Public question",
  path = "/",
  label = "Copy public question",
}: {
  question: string;
  title?: string;
  path?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(question);
    setCopied(true);
    void trackEvent("public_question_copied", { title, path }, { route: path });
    setTimeout(() => setCopied(false), 1700);
  }

  return (
    <button type="button" onClick={handleCopy} className="share-action">
      {copied ? "Copied" : label}
    </button>
  );
}
