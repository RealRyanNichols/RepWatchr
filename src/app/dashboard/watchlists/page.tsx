"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import MemberWatchlistOffice from "@/components/dashboard/MemberWatchlistOffice";

export default function DashboardWatchlistsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-slate-950">Login required</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Watchlists are saved to your member profile so alerts and digests can follow you.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_58%,#fff7ed_100%)] p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Member watch office</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-5xl">
          Watch the people, money, meetings, filings, and corrections that matter.
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-950/75">
          Build as many lists as you want. Each list can have its own digest and alert rules.
        </p>
      </div>

      <MemberWatchlistOffice />
    </main>
  );
}
