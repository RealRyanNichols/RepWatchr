import AdminDocumentReviewPanel, { type AdminRecordsResponse } from "@/components/records-responses/AdminDocumentReviewPanel";

export default function AdminRecordsResponseQueue({ responses }: { responses: AdminRecordsResponse[] }) {
  return (
    <section className="grid gap-5">
      {responses.length ? (
        responses.map((response) => <AdminDocumentReviewPanel key={response.id} response={response} />)
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">No responses yet</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">The public-records response queue is empty.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            When users paste a records response, submit a link, or upload a document, it will appear here for private review.
          </p>
        </div>
      )}
    </section>
  );
}
