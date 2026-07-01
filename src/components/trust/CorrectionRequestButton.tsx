"use client";

import { useState } from "react";
import CorrectionRequestForm from "@/components/trust/CorrectionRequestForm";
import { trackEvent } from "@/lib/analytics-client";

export default function CorrectionRequestButton({
  entityType,
  entityId,
  entityName,
  url,
  currentText,
  buttonLabel = "Request correction",
  buttonClassName,
}: {
  entityType: string;
  entityId: string;
  entityName?: string;
  url?: string;
  currentText?: string;
  buttonLabel?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  function openModal() {
    setOpen(true);
    void trackEvent("correction_clicked", {
      entity_type: entityType,
      entity_id: entityId,
    });
    void trackEvent("correction_started", {
      entity_type: entityType,
      entity_id: entityId,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          buttonClassName ??
          "inline-flex min-h-12 items-center justify-center rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        }
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
            <div className="h-1.5 bg-[linear-gradient(90deg,#b91c1c_0%,#f5d061_36%,#f8fafc_50%,#2563eb_100%)]" />
            <div className="p-5 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Correction workflow</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Request a public-record correction</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                    Corrections go to review. User submissions are not auto-published as verified facts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Close
                </button>
              </div>
              <CorrectionRequestForm
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
                url={url}
                currentText={currentText}
                onSubmitted={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
