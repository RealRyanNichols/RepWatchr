import Link from "next/link";
import CopySnippetButton from "@/components/shared/CopySnippetButton";
import {
  PUBLIC_ROLE_BOUNDARY_TEXT,
  PUBLIC_ROLE_REVIEW_LABELS,
  PUBLIC_ROLE_SOURCE_TYPES,
  getPublicRoleGroup,
  getPublicRoleSourceGroups,
  getSafePublicRoleQuestions,
  publicRoleSourceLabel,
} from "@/lib/public-role-safety";
import type { PublicPowerProfile, PublicPowerSource } from "@/types/power-watch";

type PublicRoleSafetyModuleProps = {
  profile: PublicPowerProfile;
};

function sourceLinkAttributes(source: PublicPowerSource) {
  if (source.sourceType === "policy-manual" || source.sourceType === "policy-record") {
    return { "data-agency-policy-source": source.title };
  }
  if (source.sourceType === "public-information-page" || source.sourceType === "complaint-process") {
    return { "data-public-info-source": source.title };
  }
  return {};
}

function SourceCard({ source }: { source: PublicPowerSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-slate-700/70 bg-slate-950/70 p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-slate-900"
      {...sourceLinkAttributes(source)}
    >
      <span className="text-sm font-black text-white group-hover:text-blue-100">{source.title}</span>
      <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {publicRoleSourceLabel(source.sourceType)} / checked {source.lastCheckedAt}
      </span>
    </a>
  );
}

function SourceGroup({
  title,
  emptyText,
  sources,
}: {
  title: string;
  emptyText: string;
  sources: PublicPowerSource[];
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{title}</p>
      <div className="mt-3 grid gap-3">
        {sources.length ? sources.map((source) => <SourceCard key={`${source.sourceType}-${source.url}`} source={source} />) : (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-sm font-semibold leading-6 text-slate-300">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicRoleSafetyModule({ profile }: PublicRoleSafetyModuleProps) {
  const group = getPublicRoleGroup(profile);
  const sourceGroups = getPublicRoleSourceGroups(profile.sourceLinks);
  const questions = getSafePublicRoleQuestions(profile);
  const roleLabel = group === "court" ? "court/prosecutor" : group === "badge" ? "badge/public-safety" : "public-power";
  const submitSourcePath = `/submit-source?target=${encodeURIComponent(profile.slug)}&type=official_source`;
  const correctionPath = `/submit-source?target=${encodeURIComponent(profile.slug)}&type=correction_request`;
  const safetyPath = `/submit-source?target=${encodeURIComponent(profile.slug)}&type=private_information_report`;
  const brokenLinkPath = `/feedback?type=broken_link&target=${encodeURIComponent(profile.slug)}`;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-lg">
      <div className="border-b border-slate-800 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,64,175,0.24))] p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Public role boundary</p>
        <h2 className="mt-2 text-2xl font-black text-white">Badge, court, and public-power records only</h2>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200">{PUBLIC_ROLE_BOUNDARY_TEXT}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-300/50 bg-blue-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-100">
            {roleLabel} module
          </span>
          {PUBLIC_ROLE_REVIEW_LABELS.map((label) => (
            <span
              key={label.value}
              className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-200"
            >
              {label.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
        <SourceGroup
          title={group === "court" ? "Official court sources" : "Official agency sources"}
          emptyText="No official agency or court source is attached yet. Submit an official page before treating this profile as complete."
          sources={sourceGroups.agencyOrCourt}
        />
        <SourceGroup
          title="Policy and public information"
          emptyText="No policy manual or public information page is attached yet. This is a source gap, not a finding."
          sources={sourceGroups.policyAndInfo}
        />
      </div>

      <div className="grid gap-4 border-t border-slate-800 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Public records section</p>
          {sourceGroups.publicRecords.length ? (
            <div className="mt-3 grid gap-3">
              {sourceGroups.publicRecords.map((source) => (
                <SourceCard key={`${source.sourceType}-${source.url}`} source={source} />
              ))}
            </div>
          ) : null}
          <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">Supported source categories</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PUBLIC_ROLE_SOURCE_TYPES.map((sourceType) => (
              <div key={sourceType} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-black capitalize text-slate-200">
                {sourceType}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">Incident and case mentions</p>
          <div className="mt-3 grid gap-3">
            {sourceGroups.incidentCaseMentions.length ? sourceGroups.incidentCaseMentions.map((source) => (
              <div key={`${source.sourceType}-${source.url}`} className="rounded-xl border border-amber-200/30 bg-slate-950/60 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-amber-100">Source-backed public record</p>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-black text-white hover:text-amber-100">
                  {source.title}
                </a>
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {publicRoleSourceLabel(source.sourceType)} / checked {source.lastCheckedAt}
                </p>
              </div>
            )) : (
              <p className="rounded-xl border border-dashed border-amber-200/40 bg-slate-950/50 p-4 text-sm font-semibold leading-6 text-slate-200">
                No incident or case mention is published from this module. Add an official public source for admin review before anything appears here.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-slate-800 p-5 sm:p-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Safe public questions</p>
          <div className="mt-3 grid gap-3">
            {questions.map((question) => (
              <div key={question.label} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-sm font-black text-white">{question.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{question.question}</p>
                <div className="mt-3">
                  <CopySnippetButton
                    text={question.question}
                    label="Copy public question"
                    trackingEventName="source_snippet_copied"
                    trackingMetadata={{ profileSlug: profile.slug, module: "public_role_safety" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-300/30 bg-blue-300/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Correction and safety</p>
          <div className="mt-3 grid gap-2">
            <Link href={correctionPath} data-badge-correction={profile.slug} className="secondary-button border-white/20 bg-white text-slate-950 hover:bg-blue-50">
              Request correction
            </Link>
            <Link href={safetyPath} data-safety-report={profile.slug} className="secondary-button border-white/20 bg-white text-slate-950 hover:bg-blue-50">
              Report private information
            </Link>
            <Link href={submitSourcePath} data-badge-source-submit={profile.slug} className="primary-button bg-blue-600 text-white hover:bg-blue-500">
              Submit official source
            </Link>
            <Link href={brokenLinkPath} className="secondary-button border-white/20 bg-slate-900 text-white hover:bg-slate-800">
              Report broken link
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold leading-5 text-slate-300">
            User submissions do not publish automatically. RepWatchr labels each item as a confirmed record, public question, under review, or needs source.
          </p>
        </div>
      </div>
    </section>
  );
}
