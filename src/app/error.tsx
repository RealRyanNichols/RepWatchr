"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const route = `${window.location.pathname}${window.location.search}`;
    fetch("/api/quality/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
        route,
        anonymousId: getAnonymousSessionId(),
        severity: "error",
        metadata: { digest: error.digest || "" },
      }),
    })
      .then(() => {
        trackRepWatchrEvent("app_error_logged", { source: "app_error_boundary" });
      })
      .catch(() => {
        // Error reporting cannot block the recovery UI.
      });
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">RepWatchr quality monitor</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
        This page hit an app error.
      </h1>
      <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
        The error has been sent to the RepWatchr quality queue. Try the page again, search for the record, or submit the missing source if this blocked a public-record check.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="primary-button">
          Try again
        </button>
        <Link href="/search" className="secondary-button">Search records</Link>
        <Link href="/submit-source" className="secondary-button">Submit source</Link>
      </div>
    </main>
  );
}
