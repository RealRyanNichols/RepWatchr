import type { Metadata } from "next";
import {
  AdminTable,
  CivicShell,
  CommandPaletteShell,
  DashboardPanel,
  DossierCard,
  ElasticButton,
  EmptyState,
  FeedbackButton,
  FloatingSearchShell,
  GlassPanel,
  HeatmapGrid,
  LiveCounter,
  LoadingSkeleton,
  MetricCard,
  MobileActionDock,
  OfficialHero,
  PackageInterestCard,
  ProfileCard,
  ShareButton,
  SourceLabel,
  SourcePacketPreview,
  SourceTrail,
  StickyActionRail,
  TimelineEvent,
  WatchButton,
} from "@/components/design-system";

export const metadata: Metadata = {
  title: "RepWatchr Design System",
  description: "Internal preview for the RepWatchr Civic Intelligence Terminal design system.",
  robots: {
    index: false,
    follow: false,
  },
};

const actionLinks = [
  { label: "Watch", href: "/dashboard/watchlists" },
  { label: "Share", href: "#share" },
  { label: "Source", href: "/submit-source" },
  { label: "Packet", href: "/free-packet" },
  { label: "Fix", href: "/feedback" },
];

const sourceRows = [
  {
    title: "Official committee record",
    type: "Public record",
    date: "2026-06-20",
    confidence: "confirmed" as const,
    href: "https://www.congress.gov",
  },
  {
    title: "Campaign finance filing needs source review",
    type: "Funding",
    date: "2026-06-18",
    confidence: "underReview" as const,
    href: "https://www.fec.gov",
  },
  {
    title: "Public question submitted by a verified profile",
    type: "Question",
    confidence: "publicQuestion" as const,
    href: "/submit-source",
  },
];

const packetText = `TARGET: Example County Election Office
QUESTION: Which public record confirms the meeting date?
SOURCE URL: https://example.gov/public-record
DATE OF SOURCE: 2026-06-20
WHAT NEEDS CHECKING: Confirm the filing deadline and attach the official source.
NEXT ACTION: Submit this packet to the RepWatchr review queue.`;

export default function DesignSystemPage() {
  return (
    <CivicShell>
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <StickyActionRail actions={actionLinks} />
        <div className="min-w-0 flex-1 space-y-10 pb-24">
          <section className="space-y-6">
            <SourceLabel variant="sourceBacked">Civic Intelligence Terminal</SourceLabel>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h1 className="text-[length:var(--rw-type-display-hero)] font-black leading-none text-[var(--rw-text-primary)]">
                  RepWatchr design system foundation
                </h1>
                <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-[var(--rw-text-secondary)]">
                  Internal preview for dark-mode-first civic intelligence surfaces, source trails,
                  profile dossiers, dashboards, action rails, and safe share mechanics.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ElasticButton>Primary action</ElasticButton>
                  <WatchButton watched />
                  <ShareButton
                    title="RepWatchr design-system preview"
                    path="/dev/design-system"
                    safeLine="RepWatchr is building source-first civic intelligence surfaces."
                  />
                </div>
              </div>
              <GlassPanel variant="source" glow density="roomy">
                <p className="text-xs font-black uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-accent-source)]">
                  Preview rules
                </p>
                <div className="mt-5 grid gap-3">
                  <SourceLabel variant="confirmed" />
                  <SourceLabel variant="sourceBacked" />
                  <SourceLabel variant="publicQuestion" />
                  <SourceLabel variant="needsSource" />
                  <SourceLabel variant="underReview" />
                  <SourceLabel variant="correctionRequested" />
                  <SourceLabel variant="opinion" />
                  <SourceLabel variant="allegation" />
                  <SourceLabel variant="insufficientData" />
                </div>
              </GlassPanel>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Profiles reviewed" value="Sample" subtitle="Use real counts in production" sourceLabel="Preview" />
            <MetricCard title="Source health" value="94%" subtitle="Example state only" tone="green" />
            <MetricCard title="Needs review" value="18" subtitle="Review queue example" tone="gold" />
            <MetricCard title="Broken links" value="3" subtitle="Admin-only example" tone="red" />
          </section>

          <OfficialHero
            name="Official dossier hero"
            office="Public-record profile header"
            jurisdiction="Texas / Federal / Local"
            confidence="sourceBacked"
            sourceCount={42}
            completeness={86}
          >
            <WatchButton />
            <ShareButton title="Official dossier hero" path="/officials/example" />
            <FeedbackButton kind="request-review" />
          </OfficialHero>

          <section className="grid gap-5 lg:grid-cols-3">
            <ProfileCard
              name="Example Official"
              office="County Commissioner"
              jurisdiction="Example County, TX"
              sourceCount={12}
              completeness="82%"
              trustLabel="underReview"
              href="/officials/example"
            />
            <DossierCard
              name="Source Dossier"
              office="Vote and funding summary"
              grade="B"
              stats={[
                { label: "Votes loaded", value: "38", tone: "blue" },
                { label: "Funding sources", value: "9", tone: "gold" },
                { label: "Corrections", value: "1", tone: "red" },
              ]}
            />
            <PackageInterestCard
              title="Official Record Brief"
              price="$299"
              description="Source organization, record review, and a public-accountability brief without legal advice or guaranteed political outcomes."
              href="/services/official-record-brief"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
            <SourceTrail sources={sourceRows} />
            <CommandPaletteShell
              rows={[
                { label: "Find Texas school board records", kind: "Search", tone: "blue" },
                { label: "Compare campaign funding", kind: "Funding", tone: "gold" },
                { label: "Submit a missing source", kind: "Source", tone: "green" },
                { label: "Request review", kind: "Correction", tone: "red" },
              ]}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <SourcePacketPreview title="Source packet preview" packet={packetText} />
            <div className="space-y-4">
              <TimelineEvent date="2026-06-20" title="Public source attached" source="Official record portal" trustLabel="confirmed" relatedEntity="Example County">
                A record event should show the date, source, trust label, related entity, and a short summary that does not claim more than the source supports.
              </TimelineEvent>
              <TimelineEvent date="2026-06-21" title="Contributor asked a public question" source="RepWatchr queue" trustLabel="publicQuestion">
                Public questions belong in the timeline when they are clearly labeled and connected to the next record that needs to be pulled.
              </TimelineEvent>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <DashboardPanel title="Dashboard panel" metric="8.4">
              <p className="text-sm font-semibold leading-6 text-[var(--rw-text-secondary)]">
                Dashboard modules should feel like working tools: recent changes, source status,
                watchlist movement, and next useful action.
              </p>
            </DashboardPanel>
            <LiveCounter value="Sample" label="Live counter shell" tone="violet" />
            <HeatmapGrid
              values={[
                { label: "Texas", level: 8 },
                { label: "School Boards", level: 6 },
                { label: "Funding", level: 9 },
                { label: "Water Rights", level: 5 },
                { label: "Judges", level: 4 },
                { label: "Open Records", level: 10 },
                { label: "Property Taxes", level: 7 },
                { label: "Elections", level: 8 },
                { label: "Corrections", level: 3 },
                { label: "Sources", level: 9 },
                { label: "County", level: 5 },
                { label: "Votes", level: 8 },
              ]}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <AdminTable
              columns={["Name", "Status", "Action"]}
              filters={<div className="flex flex-wrap gap-2"><FeedbackButton kind="needs-source" /><FeedbackButton kind="broken-source" /></div>}
              rows={[
                { Name: "Official profile", Status: <SourceLabel variant="underReview" />, Action: "Review" },
                { Name: "Campaign filing", Status: <SourceLabel variant="confirmed" />, Action: "Attach" },
                { Name: "Broken source", Status: <SourceLabel variant="correctionRequested" />, Action: "Fix" },
              ]}
            />
            <div className="grid gap-5">
              <FloatingSearchShell />
              <LoadingSkeleton variant="dashboard" />
            </div>
          </section>

          <EmptyState
            title="No dead-end panes"
            explanation="Empty states should point to a source submission, search, watch action, review request, or related record. The page should always create another useful click."
            action={{ label: "Submit source", href: "/submit-source" }}
            secondaryAction={{ label: "Open officials", href: "/officials" }}
          />
        </div>
      </div>
      <MobileActionDock actions={actionLinks} />
    </CivicShell>
  );
}
