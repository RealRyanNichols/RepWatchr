import RecordsResponseStatusBadge from "@/components/records-responses/RecordsResponseStatusBadge";
import { RECORDS_SENSITIVITY_STATUSES, responseStatusLabel } from "@/lib/records-response-intake";

export type AdminRecordsResponseFile = {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  page_count: number | null;
  storage_path: string | null;
  extraction_status: string | null;
  sensitivity_flags: string[] | null;
  created_at: string | null;
};

export type AdminRecordsResponse = {
  id: string;
  response_title: string | null;
  agency_name: string | null;
  jurisdiction: string | null;
  response_type: string | null;
  response_date: string | null;
  response_url: string | null;
  response_text: string | null;
  status: string | null;
  sensitivity_status: string | null;
  public_summary: string | null;
  attribution: Record<string, unknown> | null;
  created_at: string | null;
  records_response_files?: AdminRecordsResponseFile[];
};

function fileSizeLabel(value: number | null) {
  if (!value) return "unknown size";
  if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

export default function AdminDocumentReviewPanel({ response }: { response: AdminRecordsResponse }) {
  const files = response.records_response_files ?? [];

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Document review</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            {response.response_title || `${response.agency_name || "Public body"} response`}
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {response.agency_name || "Agency not supplied"} {response.jurisdiction ? `- ${response.jurisdiction}` : ""}
          </p>
        </div>
        <RecordsResponseStatusBadge status={response.status} sensitivityStatus={response.sensitivity_status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-3">
        <Info label="Type" value={responseStatusLabel(response.response_type || "other")} />
        <Info label="Date" value={response.response_date || "Not supplied"} />
        <Info label="Created" value={response.created_at ? new Date(response.created_at).toLocaleString("en-US") : "Unknown"} />
      </div>

      {response.response_url ? (
        <a
          href={response.response_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-black text-blue-700 hover:text-red-700"
        >
          Open submitted response URL
        </a>
      ) : null}

      {response.response_text ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Submitted text/excerpt</p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">
            {response.response_text.slice(0, 1600)}
            {response.response_text.length > 1600 ? "..." : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Files</p>
        {files.length ? (
          <div className="mt-3 grid gap-3">
            {files.map((file) => (
              <div key={file.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-black text-slate-950">{file.file_name || "Unnamed file"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {file.mime_type || "unknown type"} - {fileSizeLabel(file.file_size)} - extraction {file.extraction_status || "not started"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Storage path: {file.storage_path || "metadata only or upload failed"}
                </p>
                {file.sensitivity_flags?.length ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-red-700">
                    Flags: {file.sensitivity_flags.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-600">No uploaded file attached. Review link/text only.</p>
        )}
      </div>

      <form action="/api/admin/records-responses" method="post" className="mt-5 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <input type="hidden" name="response_id" value={response.id} />
        <input type="hidden" name="action" value="review_update" />
        <label className="grid gap-1 text-sm font-bold text-blue-950">
          Sensitivity status
          <select name="sensitivity_status" defaultValue={response.sensitivity_status || "needs_review"} className="field bg-white">
            {RECORDS_SENSITIVITY_STATUSES.map((status) => (
              <option key={status} value={status}>{responseStatusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-blue-950">
          Workflow status
          <select name="status" defaultValue={response.status || "new"} className="field bg-white">
            {["needs_review", "reviewed", "converted_to_packet", "attached_to_profile", "attached_to_story", "attached_to_timeline", "rejected", "archived"].map((status) => (
              <option key={status} value={status}>{responseStatusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-blue-950">
          Safe public summary
          <textarea
            name="public_summary"
            defaultValue={response.public_summary || ""}
            rows={4}
            className="field min-h-28 bg-white"
            placeholder="Only summarize what the public record supports. Do not include private data."
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-blue-950">
          Internal note
          <textarea name="note" rows={3} className="field min-h-24 bg-white" />
        </label>
        <button type="submit" className="primary-button">Save review</button>
      </form>

      <form action="/api/admin/records-responses" method="post" className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input type="hidden" name="response_id" value={response.id} />
        <input type="hidden" name="action" value="attach_source" />
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Attach after review</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Target type
            <select name="target_type" className="field bg-white">
              {["profile", "story", "race", "timeline", "source_packet"].map((type) => (
                <option key={type} value={type}>{responseStatusLabel(type)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Target ID/slug
            <input name="target_id" className="field bg-white" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Source URL
            <input name="source_url" defaultValue={response.response_url || ""} className="field bg-white" />
          </label>
        </div>
        <button type="submit" className="secondary-button w-fit">Record attach event</button>
      </form>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
