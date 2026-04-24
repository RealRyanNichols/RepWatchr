"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, profile, roles, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canReview = roles.includes("admin") || roles.includes("reviewer");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Log In
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {user.email?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="hidden sm:inline">
          {user.email?.split("@")[0]}
        </span>
        {profile?.verified && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
            Verified
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="truncate text-sm text-gray-900">{user.email}</p>
            {profile?.county && (
              <p className="text-xs text-gray-500">{profile.county}</p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Dashboard
          </Link>
          <Link
            href="/dashboard/claims"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Claims
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/profiles/claim"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Claim Profile
          </Link>
          {canReview ? (
            <>
              <div className="my-1 border-t border-gray-100" />
              <Link
                href="/admin/claims"
                className="block px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Claim Queue
              </Link>
              <Link
                href="/admin/content-review"
                className="block px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Content Review
              </Link>
            </>
          ) : null}
          {!profile?.verified && (
            <Link
              href="/auth/verify"
              className="block px-4 py-2 text-sm text-orange-600 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Verify Identity
            </Link>
          )}
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
