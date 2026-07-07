import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminAuthError, requireAdminPageAccess } from "@/lib/admin-auth";
import { getLocalMeetings, getPublicBodies } from "@/lib/local-meetings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meeting Desk | RepWatchr Admin",
  description: "Secure RepWatchr admin tools for public bodies, meetings, agendas, minutes, items, votes, and source gaps.",
  robots: { index: false, follow: false },
};

export default async function AdminMeetingsPage() {
  let adminUser;
  try {
    adminUser = await requireAdminPageAccess();
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 503) {
      return (
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Meeting Desk offline</p>
          <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for `/admin/meetings`.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Apply the local meeting tracker SQL and configure Supabase auth before using admin meeting tools.
          </p>
          <Link href="/" className="primary-button mt-5">Back to RepWatchr</Link>
        </main>
      );
    }
    throw error;
  }

  const bodies = getPublicBodies();
  const meetings = getLocalMeetings();

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Secure admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Meeting Desk</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Signed in as {adminUser.email ?? "admin"}. Create and stage public bodies, meetings, items, votes, and source gaps from official public records.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Seed bodies" value={bodies.length} />
            <Metric label="Seed meetings" value={meetings.length} />
            <Metric label="Source links" value={meetings.reduce((sum, meeting) => sum + meeting.sourceCount, 0)} />
            <Metric label="Open gaps" value={meetings.reduce((sum, meeting) => sum + meeting.sourceGaps.length, 0)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <AdminForm title="Create public body" action="create_public_body">
          <Field name="name" label="Body name" required />
          <Field name="slug" label="Slug" required />
          <Select name="body_type" label="Body type" options={["school_board", "city_council", "county_commissioners", "board", "commission", "committee", "special_district", "court", "agency_board", "other"]} />
          <Field name="state" label="State" />
          <Field name="county" label="County" />
          <Field name="city" label="City" />
          <Field name="official_url" label="Official URL" />
          <Field name="meetings_url" label="Meetings URL" />
        </AdminForm>

        <AdminForm title="Create meeting" action="create_meeting">
          <Field name="public_body_slug" label="Public body slug" required />
          <Field name="title" label="Meeting title" required />
          <Field name="slug" label="Meeting slug" required />
          <Field name="meeting_date" label="Meeting date/time" />
          <Select name="status" label="Status" options={["scheduled", "completed", "canceled", "minutes_pending", "minutes_available", "video_available", "needs_sources"]} />
          <Field name="agenda_url" label="Agenda URL" />
          <Field name="minutes_url" label="Minutes URL" />
          <Field name="video_url" label="Video URL" />
          <Field name="transcript_url" label="Transcript URL" />
        </AdminForm>

        <AdminForm title="Add meeting item" action="create_meeting_item">
          <Field name="meeting_slug" label="Meeting slug" required />
          <Field name="item_number" label="Item number" />
          <Field name="title" label="Item title" required />
          <Field name="description" label="Description" multiline />
          <Field name="action_type" label="Action type" />
          <Field name="vote_result" label="Vote result" />
          <Field name="source_url" label="Source URL" />
          <Select name="status" label="Status" options={["needs_review", "source_backed", "verified", "rejected", "archived"]} />
        </AdminForm>

        <AdminForm title="Add vote row" action="create_meeting_vote">
          <Field name="meeting_item_id" label="Meeting item UUID" required />
          <Field name="voter_name" label="Voter name" />
          <Field name="vote_position" label="Vote position" />
          <Field name="source_url" label="Source URL" />
          <Select name="confidence" label="Confidence" options={["needs_review", "source_backed", "verified", "missing_source"]} />
        </AdminForm>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function AdminForm({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return (
    <form action="/api/admin/local-meetings" method="post" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="action" value={action} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Admin action</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
      <button type="submit" className="primary-button mt-4">Save</button>
    </form>
  );
}

function Field({ name, label, required = false, multiline = false }: { name: string; label: string; required?: boolean; multiline?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      {multiline ? (
        <textarea name={name} required={required} className="field min-h-24" />
      ) : (
        <input name={name} required={required} className="field" />
      )}
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <select name={name} className="field">
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}
