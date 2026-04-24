"use client";

import Link from "next/link";
import SchoolBoardStatePicker from "@/components/school-boards/SchoolBoardStatePicker";
import { getSchoolBoardStates } from "@/data/school-board-states";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardSettingsPage() {
  const { user, loading } = useAuth();
  const states = getSchoolBoardStates({ loadedDistricts: 0, loadedProfiles: 0 });

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-gray-950">Log in required</h1>
        <p className="mt-2 text-sm font-semibold text-gray-600">
          You must be logged in to manage dashboard settings.
        </p>
        <Link
          href="/auth/login"
          className="mt-5 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-wide text-red-700">
          Dashboard settings
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">
          School Board Watch defaults
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-gray-600">
          Choose the state RepWatchr opens first for this browser. Texas remains
          the default until a user changes it.
        </p>
      </div>
      <SchoolBoardStatePicker states={states} showStats={false} />
    </div>
  );
}
