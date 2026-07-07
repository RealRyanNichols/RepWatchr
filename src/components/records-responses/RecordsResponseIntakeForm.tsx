"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAnonymousSessionId, trackRepWatchrEvent } from "@/lib/client-analytics";
import {
  buildRecordsResponsePacket,
  detectRecordsResponseSensitivity,
  RECORDS_RESPONSE_TYPES,
  type RecordsResponseType,
} from "@/lib/records-response-intake";
import { collectSourceAttribution } from "@/components/source-submissions/sourceSubmissionClient";
import RecordsResponsePreview from "@/components/records-responses/RecordsResponsePreview";
import RecordsResponseUpload from "@/components/records-responses/RecordsResponseUpload";
import RecordsResponseStatusBadge from "@/components/records-responses/RecordsResponseStatusBadge";
import SensitiveInfoWarning from "@/components/records-responses/SensitiveInfoWarning";
import SafeAIWriterButton from "@/components/ai-writing/SafeAIWriter";

type RecordsResponseApiResult = {
  ok?: boolean;
  responseId?: string;
  status?: string;
  sensitivityStatus?: string;
  packet?: string;
  nextAction?: string;
  error?: string;
};

function responseTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function RecordsResponseIntakeForm({
  defaultRecordsRequestId = "",
  compact = false,
}: {
  defaultRecordsRequestId?: string;
  compact?: boolean;
}) {
  const [started, setStarted] = useState(false);
  const [recordsRequestId, setRecordsRequestId] = useState(defaultRecordsRequestId);
  const [responseTitle, setResponseTitle] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [responseType, setResponseType] = useState("fulfilled");
  const [responseDate, setResponseDate] = useState("");
  const [responseUrl, setResponseUrl] = useState("");
  const [responseText, setResponseText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [userBelievesPublic, setUserBelievesPublic] = useState(true);
  const [submitMode, setSubmitMode] = useState<"review" | "private">("review");
  const [file, setFile] = useState<File | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecordsResponseApiResult | null>(null);

  const sensitivityText = `${responseTitle}\n${agencyName}\n${jurisdiction}\n${responseText}\n${explanation}`;
  const sensitivityFlags = useMemo(() => detectRecordsResponseSensitivity(sensitivityText), [sensitivityText]);
  const fallbackPacket = useMemo(
    () =>
      buildRecordsResponsePacket({
        recordsRequestId,
        responseTitle,
        agencyName,
        jurisdiction,
        responseType: responseType as RecordsResponseType,
        responseDate: responseDate || null,
        responseUrl,
        responseText,
        explanation,
        userBelievesPublic,
        submitMode,
        anonymousId: "",
        referrer: "",
        landingPage: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
        fileNames: file ? [file.name] : [],
        sensitivityFlags,
        sensitivityStatus: "needs_review",
      }),
    [
      agencyName,
      explanation,
      file,
      jurisdiction,
      recordsRequestId,
      responseDate,
      responseText,
      responseTitle,
      responseType,
      responseUrl,
      sensitivityFlags,
      submitMode,
      userBelievesPublic,
    ],
  );

  const canSubmit =
    agencyName.trim() &&
    (responseUrl.trim().startsWith("http") || responseText.trim() || file) &&
    explanation.trim() &&
    acknowledged &&
    !busy;

  function markStarted() {
    if (started) return;
    setStarted(true);
    trackRepWatchrEvent("records_response_started", {
      response_type: responseType,
      has_linked_request: Boolean(recordsRequestId),
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    const attribution = collectSourceAttribution();
    formData.set("recordsRequestId", recordsRequestId);
    formData.set("responseTitle", responseTitle);
    formData.set("agencyName", agencyName);
    formData.set("jurisdiction", jurisdiction);
    formData.set("responseType", responseType);
    formData.set("responseDate", responseDate);
    formData.set("responseUrl", responseUrl);
    formData.set("responseText", responseText);
    formData.set("explanation", explanation);
    formData.set("userBelievesPublic", userBelievesPublic ? "true" : "false");
    formData.set("submitMode", submitMode);
    formData.set("anonymousId", getAnonymousSessionId());
    formData.set("website", trap);
    formData.set("referrer", attribution.referrer ?? "");
    formData.set("landingPage", attribution.landingPage ?? "");
    formData.set("utmSource", attribution.utmSource ?? "");
    formData.set("utmMedium", attribution.utmMedium ?? "");
    formData.set("utmCampaign", attribution.utmCampaign ?? "");
    formData.set("utmTerm", attribution.utmTerm ?? "");
    formData.set("utmContent", attribution.utmContent ?? "");
    if (file) formData.set("file", file);

    try {
      const response = await fetch("/api/records-responses", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as RecordsResponseApiResult | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || "The response intake queue is temporarily unavailable. Copy the packet and try again.");
        setResult({ packet: data?.packet || fallbackPacket, status: "local_backup", sensitivityStatus: "needs_review" });
        return;
      }

      setResult(data);
      trackRepWatchrEvent("records_response_submitted", {
        response_type: responseType,
        response_id: data.responseId || "",
        submit_mode: submitMode,
        has_file: Boolean(file),
      });
      if (data.packet) {
        trackRepWatchrEvent("records_response_packet_generated", {
          response_id: data.responseId || "",
        });
      }
    } catch {
      setError("The response intake queue is temporarily unavailable. Copy the packet and try again.");
      setResult({ packet: fallbackPacket, status: "local_backup", sensitivityStatus: "needs_review" });
    } finally {
      setBusy(false);
    }
  }

  if (result?.responseId) {
    return (
      <div className="grid gap-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Response received</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Saved for private review.</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-950">
              ID: {result.responseId}
            </span>
            <RecordsResponseStatusBadge status={result.status} sensitivityStatus={result.sensitivityStatus} />
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
            {result.nextAction || "Admin review is required before this response can become a public source, story, profile attachment, or timeline event."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/free-packet" className="primary-button">Build packet</Link>
            <Link href="/submit-source" className="secondary-button">Submit another source</Link>
            <Link href="/dashboard/records-responses" className="secondary-button">Open dashboard status</Link>
          </div>
        </div>
        {result.packet ? <RecordsResponsePreview packet={result.packet} fileNameSeed={responseTitle || agencyName} /> : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      onFocus={markStarted}
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ${compact ? "text-sm" : ""}`}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public records response</p>
        <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">Turn a records response into a reviewable source packet.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Paste the link, copy the email response, or upload the document. Nothing becomes public until RepWatchr reviews for private data and source fit.
        </p>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">{error}</p>
        </div>
      ) : null}

      <input
        tabIndex={-1}
        autoComplete="off"
        value={trap}
        onChange={(event) => setTrap(event.target.value)}
        name="company_website"
        className="hidden"
        aria-hidden="true"
      />

      <div className="mt-6 grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Linked records request ID
            <input
              value={recordsRequestId}
              onChange={(event) => setRecordsRequestId(event.target.value)}
              placeholder="Optional UUID from dashboard"
              className="field"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Response title
            <input
              value={responseTitle}
              onChange={(event) => setResponseTitle(event.target.value)}
              placeholder="Example: Nacogdoches ISD agenda response"
              maxLength={255}
              className="field"
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Agency or public body
            <input
              value={agencyName}
              onChange={(event) => setAgencyName(event.target.value)}
              required
              maxLength={255}
              className="field"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Jurisdiction
            <input
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
              placeholder="Texas, Gregg County, Longview ISD"
              maxLength={255}
              className="field"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Response date
            <input
              value={responseDate}
              onChange={(event) => setResponseDate(event.target.value)}
              type="date"
              className="field"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Response type
          <select value={responseType} onChange={(event) => setResponseType(event.target.value)} className="field">
            {RECORDS_RESPONSE_TYPES.map((type) => (
              <option key={type} value={type}>{responseTypeLabel(type)}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Public response URL
          <input
            value={responseUrl}
            onChange={(event) => setResponseUrl(event.target.value)}
            placeholder="https://..."
            className="field"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Paste email response or excerpt
            <textarea
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              rows={9}
              className="field min-h-48"
            />
          </label>
          <RecordsResponseUpload
            onFileSelected={(selectedFile) => {
              setFile(selectedFile);
              if (selectedFile) {
                trackRepWatchrEvent("records_response_file_uploaded", {
                  file_type: selectedFile.type || "unknown",
                  file_size: selectedFile.size,
                });
              }
            }}
          />
        </div>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          What should RepWatchr check or build from this response?
          <textarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            required
            rows={5}
            className="field min-h-32"
          />
        </label>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-900">Safe writing helper</p>
          <p className="mt-1 text-sm font-bold leading-6 text-blue-950">
            Draft a private review summary for this records response. Nothing becomes public until review.
          </p>
          <div className="mt-3">
            <SafeAIWriterButton
              useCase="records_request_summary"
              target={agencyName || responseTitle || "records response"}
              topic={explanation || responseTitle || responseTypeLabel(responseType)}
              sourceUrl={responseUrl}
              existingText={explanation}
              contextPayload={{
                records_request_id: recordsRequestId,
                response_title: responseTitle,
                agency_name: agencyName,
                jurisdiction,
                response_type: responseType,
                response_url_present: Boolean(responseUrl),
                response_text_excerpt: responseText.slice(0, 1200),
                sensitivity_flags: sensitivityFlags.join(", "),
                submit_mode: submitMode,
              }}
              buttonLabel="Draft safe review summary"
              title="Draft a safe records-response summary"
              onInsert={setExplanation}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-950 hover:border-red-300 hover:text-red-700"
            />
          </div>
        </div>

        <SensitiveInfoWarning text={sensitivityText} />

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={userBelievesPublic}
              onChange={(event) => setUserBelievesPublic(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            I believe this response was produced as a public records response. RepWatchr still must review it before public display.
          </label>
          <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4"
              required
            />
            I understand uploaded documents are private by default and may not be published if they contain private addresses, minors, medical data, sealed records, or unsupported claims.
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm font-black text-blue-950">
            <input type="radio" checked={submitMode === "review"} onChange={() => setSubmitMode("review")} />
            Submit for RepWatchr review
          </label>
          <label className="flex items-center gap-3 text-sm font-black text-blue-950">
            <input type="radio" checked={submitMode === "private"} onChange={() => setSubmitMode("private")} />
            Save privately first
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={!canSubmit} className="primary-button disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Saving..." : submitMode === "private" ? "Save private draft" : "Submit response"}
          </button>
          <Link href="/free-packet" className="secondary-button">Open packet builder</Link>
        </div>
      </div>
    </form>
  );
}
