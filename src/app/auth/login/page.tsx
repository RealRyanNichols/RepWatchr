"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed. Check the member database configuration.");
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }

    setMagicLoading(true);

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (magicError) {
        setError(magicError.message);
        setMagicLoading(false);
        return;
      }

      setNotice("Check your email for the RepWatchr sign-in link. It opens your dashboard after confirmation.");
      setMagicLoading(false);
    } catch (magicError) {
      setError(magicError instanceof Error ? magicError.message : "Magic link failed. Check the member database configuration.");
      setMagicLoading(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_52%,#fff7ed_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Member access</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-blue-950 sm:text-5xl">
            Log in. Track officials. Ask Faretta AI.
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-blue-950/75">
            Use a password if you have one, or send yourself a one-click magic link and get into the dashboard without friction.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Profile", "Watch list", "Faretta AI"].map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white p-4 text-sm font-black text-blue-950 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-blue-100/70 sm:p-8">
          <h2 className="text-2xl font-black text-gray-900">Log In</h2>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            Sign in to vote, comment, save tracked profiles, and use member tools.
          </p>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm font-semibold text-green-800">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || magicLoading}
              className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:bg-blue-400"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-black uppercase tracking-wide text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading || magicLoading}
            className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-black text-blue-950 transition-colors hover:border-red-200 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {magicLoading ? "Sending Link..." : "Email Me a Magic Link"}
          </button>

          <p className="mt-3 text-xs font-semibold leading-5 text-gray-500">
            Magic links also create a free member account if this is your first time signing in.
          </p>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/create-account" className="font-medium text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
