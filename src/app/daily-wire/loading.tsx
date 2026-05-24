export default function DailyWireLoading() {
  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <div className="h-4 w-40 rounded-full bg-slate-200" />
          <div className="mt-5 h-12 max-w-3xl rounded-xl bg-slate-200" />
          <div className="mt-3 h-12 max-w-2xl rounded-xl bg-slate-100" />
        </section>
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-slate-200" />
                <div className="h-6 w-28 rounded-full bg-slate-100" />
              </div>
              <div className="mt-4 h-7 max-w-3xl rounded-lg bg-slate-200" />
              <div className="mt-3 h-16 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
