import Link from "next/link";
import { redirect } from "next/navigation";
import RepWatchrMemberDashboard from "@/components/dashboard/RepWatchrMemberDashboard";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wide text-red-700">Member database offline</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950">Dashboard requires Supabase auth.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Set the Supabase public URL and anon key before members can use the private dashboard.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl bg-blue-950 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-700"
        >
          Back to RepWatchr
        </Link>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  return <RepWatchrMemberDashboard initialEmail={user.email ?? ""} />;
}
