"use client";

import Link from "next/link";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type NextUsefulMoveProps = {
  title?: string;
  context?: string;
  recordPath?: string;
  sourcePath?: string;
  packetPath?: string;
  safeShareLine?: string;
  meetingQuestion?: string;
};

async function copyValue(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function NextUsefulMove({
  title = "Your next useful move",
  context = "Pick one action that adds a record, checks a claim, or shares the receipt.",
  recordPath = "/dashboard",
  sourcePath = "/submit-source",
  packetPath = "/free-packet",
  safeShareLine = "RepWatchr keeps public claims tied to public sources. Open the record, check the receipt, and submit a better source if one is missing.",
  meetingQuestion = "What public record supports this decision, and where can citizens inspect it?",
}: NextUsefulMoveProps) {
  async function copyLine(kind: "safe_share_line" | "meeting_question", value: string) {
    await copyValue(value);
    trackRepWatchrEvent(kind === "safe_share_line" ? "share_copy_clicked" : "source_snippet_copied", {
      action: kind,
      route: typeof window !== "undefined" ? window.location.pathname : "",
    });
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{context}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Link href={recordPath} className="secondary-button text-center" onClick={() => trackRepWatchrEvent("profile_watch_clicked", { route: recordPath })}>
          Watch this record
        </Link>
        <Link href={sourcePath} className="secondary-button text-center">
          Submit one source
        </Link>
        <button type="button" className="secondary-button" onClick={() => copyLine("safe_share_line", safeShareLine)}>
          Copy safe line
        </button>
        <Link href={packetPath} className="secondary-button text-center">
          Build source packet
        </Link>
        <button type="button" className="secondary-button" onClick={() => copyLine("meeting_question", meetingQuestion)}>
          Before meeting
        </button>
      </div>
    </section>
  );
}

