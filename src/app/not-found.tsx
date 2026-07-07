import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Record not found</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
        This RepWatchr page is not live.
      </h1>
      <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
        Search the public record, open the officials directory, or submit the source that should exist here.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/search" className="primary-button">Search RepWatchr</Link>
        <Link href="/officials" className="secondary-button">Open officials</Link>
        <Link href="/submit-source" className="secondary-button">Submit source</Link>
      </div>
    </main>
  );
}
