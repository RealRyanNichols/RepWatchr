import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ShareButtons from "@/components/shared/ShareButtons";
import {
  getCandidateSources,
  getElectionCandidate,
  getElectionCandidates,
  type CandidateRecordItem,
  type CandidateSource,
  type CandidateSourceKind,
  type ElectionCandidateProfile,
} from "@/data/election-candidates";
import {
  absoluteRepWatchrUrl,
  buildOgImageUrl,
  buildRepWatchrMetadata,
} from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import styles from "./CandidateProfile.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getElectionCandidates().map((candidate) => ({
    candidateSlug: candidate.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ candidateSlug: string }>;
}): Promise<Metadata> {
  const { candidateSlug } = await params;
  const candidate = getElectionCandidate(candidateSlug);

  if (!candidate) return { title: "Candidate Not Found" };

  return buildRepWatchrMetadata({
    title: `${candidate.name} | Marion County Judge Candidate Profile`,
    description:
      "Open Dina K. Carroll's sourced Marion County Judge candidate profile: write-in status, independently supported community record, campaign claims, priorities, and evidence gaps.",
    path: candidate.path,
    imagePath: buildOgImageUrl("candidate", { slug: candidate.slug }),
    imageAlt:
      "Dina K. Carroll portrait with the headline Dina Carroll: open the write-in file",
    type: "profile",
  });
}

function formatReviewDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function sourceKindLabel(kind: CandidateSourceKind) {
  if (kind === "official") return "Official record";
  if (kind === "campaign") return "Campaign source";
  return "Independent reporting";
}

function SourceLinks({
  candidate,
  sourceIds,
}: {
  candidate: ElectionCandidateProfile;
  sourceIds: string[];
}) {
  const sources = getCandidateSources(candidate, sourceIds);

  return (
    <div className={styles.receiptLinks} aria-label="Sources for this record">
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          data-source-kind={source.kind}
        >
          <span>{sourceKindLabel(source.kind)}</span>
          {source.title}
          <b aria-hidden="true">↗</b>
        </a>
      ))}
    </div>
  );
}

function RecordCard({
  candidate,
  item,
  label,
  tone,
}: {
  candidate: ElectionCandidateProfile;
  item: CandidateRecordItem;
  label: string;
  tone: "verified" | "campaign";
}) {
  return (
    <article className={styles.recordCard} data-record-tone={tone}>
      <p className={styles.cardLabel}>{label}</p>
      <h3>{item.title}</h3>
      <p>{item.detail}</p>
      <SourceLinks candidate={candidate} sourceIds={item.sourceIds} />
    </article>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className={styles.sectionHeading}>
      <span>{number}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <div className={styles.sectionIntro}>{children}</div>
      </div>
    </header>
  );
}

function SourceLedger({ sources }: { sources: CandidateSource[] }) {
  const groups: Array<{ kind: CandidateSourceKind; title: string }> = [
    { kind: "official", title: "Official records" },
    { kind: "reporting", title: "Independent reporting" },
    { kind: "campaign", title: "Candidate-published material" },
  ];

  return (
    <div className={styles.sourceLedger}>
      {groups.map((group) => {
        const groupedSources = sources.filter((source) => source.kind === group.kind);
        return (
          <section key={group.kind}>
            <div className={styles.sourceGroupHeader}>
              <h3>{group.title}</h3>
              <span>{groupedSources.length}</span>
            </div>
            <div className={styles.sourceList}>
              {groupedSources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>{source.title}</strong>
                  <span>{source.note}</span>
                  <b aria-hidden="true">Open source ↗</b>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ candidateSlug: string }>;
}) {
  const { candidateSlug } = await params;
  const candidate = getElectionCandidate(candidateSlug);

  if (!candidate) notFound();

  const reviewedOn = formatReviewDate(candidate.lastVerifiedAt);
  const writeInRulesSource = candidate.sources.find(
    (source) => source.id === "texas-write-in-rules",
  );
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${absoluteRepWatchrUrl(candidate.path)}#profile`,
    url: absoluteRepWatchrUrl(candidate.path),
    name: `${candidate.name} candidate profile`,
    description: candidate.summary,
    dateModified: candidate.lastVerifiedAt,
    isPartOf: {
      "@type": "WebSite",
      name: "RepWatchr",
      url: absoluteRepWatchrUrl("/"),
    },
    mainEntity: {
      "@type": "Person",
      "@id": `${absoluteRepWatchrUrl(candidate.path)}#candidate`,
      name: candidate.name,
      url: absoluteRepWatchrUrl(candidate.path),
      image: absoluteRepWatchrUrl(candidate.portrait.src),
      description: candidate.summary,
      sameAs: [
        candidate.contact.website,
        candidate.contact.facebook,
        candidate.contact.instagram,
      ],
      subjectOf: {
        "@type": "WebPage",
        name: `${candidate.officeSought} 2026 race watch`,
        url: absoluteRepWatchrUrl(candidate.racePath),
      },
    },
  };
  const breadcrumbs = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Texas elections", path: "/elections/texas" },
    { name: "Marion County Judge", path: candidate.racePath },
    { name: candidate.name, path: candidate.path },
  ]);

  return (
    <article className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />

      <section className={styles.hero}>
        <div className={styles.heroTexture} aria-hidden="true" />
        <div className={styles.heroShell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/elections/texas">Texas elections</Link>
            <span>/</span>
            <Link href={candidate.racePath}>Marion County Judge</Link>
            <span>/</span>
            <strong>{candidate.name}</strong>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Marion County · candidate record</p>
              <h1>{candidate.name}</h1>
              <p className={styles.office}>{candidate.officeSought}</p>
              <p className={styles.lede}>{candidate.summary}</p>

              <div className={styles.statusPanel}>
                <p>Current ballot status</p>
                <strong>{candidate.ballotStatus}</strong>
                <span>Last source review: {reviewedOn}</span>
              </div>

              <div className={styles.heroActions}>
                <Link href={candidate.racePath} className={styles.primaryAction}>
                  Compare the race
                </Link>
                <a
                  href={candidate.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.secondaryAction}
                >
                  Candidate website ↗
                </a>
              </div>
            </div>

            <figure className={styles.portrait}>
              <div className={styles.portraitFrame}>
                <Image
                  src={candidate.portrait.src}
                  alt={candidate.portrait.alt}
                  fill
                  preload
                  quality={90}
                  sizes="(max-width: 860px) 92vw, 520px"
                  style={{ objectPosition: candidate.portrait.objectPosition }}
                />
                <div className={styles.portraitMark}>
                  <span>Write-in file</span>
                  <b>2026</b>
                </div>
              </div>
              <figcaption>
                <span>Public candidate image</span>
                <a
                  href={candidate.portrait.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {candidate.portrait.credit} ↗
                </a>
              </figcaption>
            </figure>
          </div>

          <dl className={styles.heroRail}>
            <div>
              <dt>Profile sources</dt>
              <dd>{candidate.sources.length}</dd>
              <span>Official, reporting and campaign</span>
            </div>
            <div>
              <dt>Performance grade</dt>
              <dd>Not rated</dd>
              <span>No incumbency record to score</span>
            </div>
            <div>
              <dt>Party status</dt>
              <dd>Not located</dd>
              <span>In reviewed public material</span>
            </div>
            <div>
              <dt>Election</dt>
              <dd>Nov. 3</dd>
              <span>2026 general election</span>
            </div>
          </dl>
        </div>
      </section>

      <nav className={styles.chapterNav} aria-label="Candidate profile sections">
        <div>
          <a href="#verified">Verified record</a>
          <a href="#campaign">Campaign account</a>
          <a href="#authority">Office authority</a>
          <a href="#gaps">Evidence gaps</a>
          <a href="#contact">Contact</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <div className={styles.contentShell}>
        <section className={styles.editorialOpening}>
          <p className={styles.openingNumber}>01</p>
          <div>
            <p className={styles.eyebrow}>What voters should know first</p>
            <h2>A public campaign is underway. Qualification is still a verification question.</h2>
            <p>
              Carroll has announced a write-in campaign, and Marion County posts her
              campaign-treasurer appointment. RepWatchr has not located an accepted write-in
              declaration or county-published qualified-write-in roster naming her. Those are
              different records, so this page does not collapse them into one claim.
            </p>
            <p>
              Texas sets 5 p.m. August 17, 2026 as the write-in filing deadline for this
              general election.
              {writeInRulesSource ? (
                <>
                  {" "}
                  <a
                    href={writeInRulesSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read the official write-in procedures ↗
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <aside>
            <span>Editorial posture</span>
            <strong>OPEN FILE</strong>
            <p>Campaign claims are attributed. Independent records are shown separately.</p>
          </aside>
        </section>

        <section id="verified" className={styles.section}>
          <SectionHeading
            number="02"
            eyebrow="Outside the campaign"
            title="What the public record supports"
          >
            These items have an official record or independent reporting attached. They do not
            prove readiness to run Marion County; they establish the public-service record voters
            can inspect now.
          </SectionHeading>
          <div className={styles.recordGrid}>
            {candidate.independentRecord.map((item) => (
              <RecordCard
                key={item.title}
                candidate={candidate}
                item={item}
                label="Supported record"
                tone="verified"
              />
            ))}
          </div>
        </section>

        <section id="campaign" className={`${styles.section} ${styles.campaignSection}`}>
          <SectionHeading
            number="03"
            eyebrow="Candidate-published account"
            title="What Carroll says about herself and the job"
          >
            These are campaign claims and campaign priorities. The labels stay visible so a
            reader never mistakes self-description for independent verification.
          </SectionHeading>

          <div className={styles.campaignColumns}>
            <div>
              <p className={styles.columnLabel}>Biography claims</p>
              <div className={styles.stack}>
                {candidate.campaignClaims.map((item) => (
                  <RecordCard
                    key={item.title}
                    candidate={candidate}
                    item={item}
                    label="Campaign claim"
                    tone="campaign"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className={styles.columnLabel}>Published priorities</p>
              <div className={styles.stack}>
                {candidate.campaignPriorities.map((item) => (
                  <RecordCard
                    key={item.title}
                    candidate={candidate}
                    item={item}
                    label="Campaign position"
                    tone="campaign"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="authority" className={styles.authoritySection}>
          <div>
            <p className={styles.eyebrow}>The job she is asking voters to give her</p>
            <h2>County judge is an executive, budget and court-administration office.</h2>
            <p>
              The title is broader than a courtroom role. Voters are choosing countywide
              leadership over Commissioners Court, public administration and emergency response,
              plus the applicable constitutional county-court docket.
            </p>
            <SourceLinks
              candidate={candidate}
              sourceIds={["county-judge-office", "county-court-jurisdiction"]}
            />
          </div>
          <ol>
            {candidate.officeAuthority.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <section id="gaps" className={styles.section}>
          <SectionHeading
            number="04"
            eyebrow="No invented certainty"
            title="Evidence voters still need"
          >
            Missing evidence is not a negative finding. It is a research queue and an invitation
            for the candidate, county or public to attach the best available record.
          </SectionHeading>

          <div className={styles.gapPanel}>
            <ul>
              {candidate.evidenceGaps.map((gap) => (
                <li key={gap}>
                  <span aria-hidden="true">?</span>
                  {gap}
                </li>
              ))}
            </ul>
            <div>
              <p>Party status</p>
              <strong>{candidate.partyStatus}</strong>
              <Link
                href={`/submit-source?target=${encodeURIComponent(candidate.slug)}&type=missing_source`}
              >
                Add a public record
              </Link>
            </div>
          </div>
        </section>

        <section id="contact" className={styles.contactSection}>
          <div>
            <p className={styles.eyebrow}>Candidate contact</p>
            <h2>Ask for the plan. Send the response back with a source.</h2>
            <p>
              Contact details below are campaign-published. RepWatchr offers the candidate the
              same visible correction and right-of-response path as every person in the public
              record.
            </p>
          </div>
          <address>
            <a href={candidate.contact.website} target="_blank" rel="noopener noreferrer">
              writeindina.com ↗
            </a>
            <a href={`mailto:${candidate.contact.email}`}>{candidate.contact.email}</a>
            <a href={`tel:+1${candidate.contact.phone.replace(/\D/g, "")}`}>
              {candidate.contact.phone}
            </a>
            <span>{candidate.contact.mailingAddress}</span>
            <div>
              <a href={candidate.contact.facebook} target="_blank" rel="noopener noreferrer">
                Facebook ↗
              </a>
              <a href={candidate.contact.instagram} target="_blank" rel="noopener noreferrer">
                Instagram ↗
              </a>
            </div>
          </address>
          <div className={styles.responseCard}>
            <span>Correction & response</span>
            <strong>Something missing or wrong?</strong>
            <p>
              Send the public source, the precise correction, or the candidate&apos;s on-record
              response. RepWatchr reviews the receipt before changing the profile.
            </p>
            <Link
              href={`/submit-source?target=${encodeURIComponent(candidate.slug)}&type=correction_request`}
            >
              Submit correction or response
            </Link>
          </div>
        </section>

        <section id="sources" className={styles.section}>
          <SectionHeading
            number="05"
            eyebrow={`Source review updated ${reviewedOn}`}
            title="Every receipt behind this profile"
          >
            Official records, independent reporting and candidate-published material stay in
            separate lanes. A campaign source can establish what a candidate said; it does not
            independently prove the claim.
          </SectionHeading>
          <SourceLedger sources={candidate.sources} />
        </section>

        <section className={styles.shareSection}>
          <div>
            <p className={styles.eyebrow}>Marion County race file</p>
            <h2>Compare both candidates before sharing a conclusion.</h2>
            <p>
              Open the complete race page for LaFleur&apos;s incumbent record, Carroll&apos;s
              write-in challenge, the office-specific grade method and the full source ledger.
            </p>
            <Link href={candidate.racePath}>Open Dina Carroll vs. Leward LaFleur</Link>
          </div>
          <ShareButtons
            title={`${candidate.name}: Marion County Judge candidate profile`}
            description="Write-in status, independently supported public service, campaign claims and visible evidence gaps."
            path={candidate.path}
            template="public_question"
            subject={candidate.name}
            sourceLabel={`${candidate.sources.length} labeled profile sources`}
          />
        </section>
      </div>
    </article>
  );
}
