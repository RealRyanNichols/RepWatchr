"use client";

export default function RecordsResponseUpload({
  onFileSelected,
}: {
  onFileSelected?: (file: File | null) => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Upload response document
        <input
          name="file"
          type="file"
          accept=".pdf,.txt,.csv,.doc,.docx,.png,.jpg,.jpeg,application/pdf,text/plain,text/csv,image/png,image/jpeg"
          className="field bg-white"
          onChange={(event) => onFileSelected?.(event.currentTarget.files?.[0] ?? null)}
        />
      </label>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        Uploads go to protected storage when Supabase storage is configured. RepWatchr does not create a public file URL automatically.
      </p>
    </div>
  );
}
