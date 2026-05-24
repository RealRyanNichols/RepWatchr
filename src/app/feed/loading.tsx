export default function FeedLoading() {
  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-slate-200" />
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_0.82fr] lg:p-7">
            <div>
              <div className="h-4 w-40 rounded-full bg-slate-200" />
              <div className="mt-4 h-16 max-w-xl rounded-xl bg-slate-200" />
              <div className="mt-4 h-20 max-w-3xl rounded-xl bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-96 rounded-2xl border border-slate-300 bg-white shadow-sm" />
            ))}
          </div>
          <div className="hidden space-y-4 lg:block">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-48 rounded-2xl border border-slate-300 bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
