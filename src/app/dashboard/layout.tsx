import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Member Dashboard",
  description: "Private RepWatchr member command center for watchlists, submissions, packets, records drafts, and digest settings.",
  robots: {
    index: false,
    follow: false,
  },
};

function authConfigured() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "false"
  );
}

function DashboardAuthPlaceholder() {
  return (
    <div className="min-h-screen bg-[#050817] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_34%),linear-gradient(135deg,rgba(239,68,68,0.20),rgba(15,23,42,0.92))] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">
            Protected member route
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Dashboard architecture is ready. Supabase auth is not enabled in this environment.
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-200 sm:text-base">
            Production needs Supabase URL, anon key, auth enabled, RLS policies, and the member dashboard migration before private user data can load.
          </p>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          {[
            ["Auth required", "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."],
            ["Server checks", "The route validates the Supabase user before rendering member modules."],
            ["No public data leak", "Without auth, only this setup placeholder is shown."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <p className="text-sm font-black text-white">{title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:bg-red-100"
          >
            Back to RepWatchr
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!authConfigured()) {
    return <DashboardAuthPlaceholder />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  return children;
}
