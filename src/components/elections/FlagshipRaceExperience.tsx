import Link from "next/link";
import type { ReactNode } from "react";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";
import RaceCommunityPoll from "./RaceCommunityPoll";
import styles from "./FlagshipRaceExperience.module.css";

const RACE_PATH = "/elections/texas/marion-county-judge-2026";

const sources = [
  {
    label: "Marion County elections",
    href: "https://marioncountytaxoffice.com/elections/",
    type: "Official",
  },
  {
    label: "Official 2026 Republican primary results",
    href: "https://marioncountytaxoffice.com/wp-content/uploads/2026/03/OFFICIAL-RESULTS-REPUBLICAN-PARTY.pdf",
    type: "Official",
  },
  {
    label: "Texas write-in candidate procedures",
    href: "https://www.sos.state.tx.us/elections/candidates/guide/2026/writein2026.shtml",
    type: "Official",
  },
  {
    label: "KLTV: allegations and LaFleur response",
    href: "https://www.kltv.com/2026/04/21/marion-county-judge-denies-allegations-unwanted-touching-halloween-party/",
    type: "Reporting",
  },
  {
    label: "CBS19: February complaint and denial",
    href: "https://www.cbs19.tv/article/news/local/marion-county-judge-leward-lafleur-denies-groping-teen-party/501-525ec554-78d1-440a-9fd7-eb2730adbb4e",
    type: "Reporting",
  },
  {
    label: "News-Journal: prosecutorial review and correction",
    href: "https://news-journal.com/2026/04/21/da-to-review-additional-complaint-possible-felony-charges-against-marion-county-judge/",
    type: "Reporting",
  },
  {
    label: "Dina Carroll campaign-treasurer appointment",
    href: "https://marioncountytaxoffice.com/wp-content/uploads/2026/07/CTA-D-CARROLL.pdf",
    type: "Official",
  },
  {
    label: "Carroll write-in announcement",
    href: "https://marshallnewsmessenger.com/2026/07/09/jefferson-community-advocate-announces-write-in-candidacy-for-marion-county-judge/",
    type: "Reporting",
  },
];

const scoringRows = [
  ["Stewardship & delivery", "30%", "Budgets, audits, roads, emergency management and measurable county outcomes"],
  ["Transparency & access", "20%", "Records compliance, meeting access, disclosure and responsiveness"],
  ["Attendance & decisions", "20%", "Commissioners Court participation, votes, recusals and stated reasons"],
  ["Ethics & compliance", "20%", "Authoritative findings, conflicts, campaign compliance and corrective action"],
  ["Public response", "10%", "Answers, corrections and follow-through on documented public questions"],
] as const;

function CandidatePortrait({
  initials,
  tone,
}: {
  initials: string;
  tone: "incumbent" | "challenger";
}) {
  return (
    <div className={`${styles.portrait} ${styles[tone]}`} aria-label="Portrait authorization pending">
      <span aria-hidden="true">{initials}</span>
      <small>High-resolution photo release requested</small>
    </div>
  );
}

function SourceLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className={styles.externalMark} aria-hidden="true">↗</span>
    </a>
  );
}

export default function FlagshipRaceExperience() {
  const pollEnabled =
    repwatchrFeatureFlags.racePollsV1 &&
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="race-title">
        <div className={styles.heroImage} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/east-texas">East Texas desk</Link>
            <span>/</span>
            <span>Marion County</span>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Election 2026 · Marion County, Texas</p>
              <h1 id="race-title">
                Dina Carroll
                <span>vs.</span>
                Leward LaFleur
              </h1>
              <p className={styles.dek}>
                One incumbent. One declared write-in challenger. A countywide office with
                real power over budgets, emergencies, public meetings and the constitutional
                county court.
              </p>
              <div className={styles.heroActions}>
                <a href="#community-poll" className={styles.primaryAction}>Weigh in</a>
                <a href="#record" className={styles.secondaryAction}>See the record</a>
              </div>
            </div>

            <aside className={styles.electionPlate} aria-label="Election status">
              <p>General election</p>
              <strong>Nov. 3</strong>
              <span>2026</span>
              <dl>
                <div>
                  <dt>Office</dt>
                  <dd>County Judge</dd>
                </div>
                <div>
                  <dt>Electorate</dt>
                  <dd>Marion County</dd>
                </div>
                <div>
                  <dt>Race status</dt>
                  <dd>Write-in challenge</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <nav className={styles.chapterNav} aria-label="Race page sections">
        <div>
          <a href="#candidates">Candidates</a>
          <a href="#record">Accountability</a>
          <a href="#community-poll">Community pulse</a>
          <a href="#method">Grade method</a>
          <a href="#discussion">Discussion</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <section className={styles.opening} aria-labelledby="opening-title">
        <p className={styles.sectionNumber}>01</p>
        <div>
          <p className={styles.eyebrow}>What voters need to know first</p>
          <h2 id="opening-title">The race is real. Some of the evidence is still catching up.</h2>
          <p>
            LaFleur is the sitting Republican county judge and won an unopposed primary.
            Carroll has announced a write-in challenge and filed a campaign-treasurer
            appointment. RepWatchr has not yet located the county’s accepted declaration or
            qualified-write-in roster, so her ballot status remains explicitly unconfirmed.
          </p>
        </div>
        <div className={styles.truthBox}>
          <strong>Current editorial grade</strong>
          <span>NR</span>
          <p>Records pending. Public sentiment and allegations do not manufacture a performance score.</p>
        </div>
      </section>

      <section id="candidates" className={styles.candidateSection} aria-labelledby="candidate-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>The choice</p>
          <h2 id="candidate-heading">Two different claims on county leadership</h2>
          <p>Verified biography is separated from campaign claims, public opinion and unresolved reporting.</p>
        </header>

        <div className={styles.candidateGrid}>
          <article className={styles.candidate}>
            <CandidatePortrait initials="LC" tone="challenger" />
            <div className={styles.candidateIdentity}>
              <p>Declared write-in · qualification pending</p>
              <h3>Dina K. Carroll</h3>
              <span>Jefferson educator and community volunteer</span>
            </div>
            <dl className={styles.candidateFacts}>
              <div>
                <dt>Public record</dt>
                <dd>Teaching and animal-welfare volunteer work are independently reported.</dd>
              </div>
              <div>
                <dt>Still needed</dt>
                <dd>Accepted write-in declaration, full biography documentation and policy specifics.</dd>
              </div>
              <div>
                <dt>Party</dt>
                <dd>No party affiliation located in the official filing or campaign materials.</dd>
              </div>
            </dl>
            <div className={styles.candidateLinks}>
              <SourceLink href="https://writeindina.com/">Campaign website</SourceLink>
              <SourceLink href="https://www.facebook.com/writeindina/">Facebook</SourceLink>
              <SourceLink href="https://www.instagram.com/dcjcarroll2/">Instagram</SourceLink>
            </div>
          </article>

          <div className={styles.versus} aria-hidden="true">
            <span>VS</span>
          </div>

          <article className={styles.candidate}>
            <CandidatePortrait initials="LL" tone="incumbent" />
            <div className={styles.candidateIdentity}>
              <p>Republican nominee · incumbent</p>
              <h3>Leward J. LaFleur II</h3>
              <span>Marion County Judge</span>
            </div>
            <dl className={styles.candidateFacts}>
              <div>
                <dt>Documented record</dt>
                <dd>Regional workforce and transportation leadership; Lake O’ the Pines advocacy.</dd>
              </div>
              <div>
                <dt>Current concern</dt>
                <dd>Two reported misconduct allegations are disputed and procedurally unresolved.</dd>
              </div>
              <div>
                <dt>Primary result</dt>
                <dd>1,079 votes in an unopposed Republican primary; 594 undervotes.</dd>
              </div>
            </dl>
            <div className={styles.candidateLinks}>
              <Link href="/officials/leward-j-lafleur-ii">Open full profile</Link>
              <SourceLink href="https://www.co.marion.tx.us/page/marion.County.Judge">Official office</SourceLink>
              <SourceLink href="https://www.facebook.com/lewardformarioncounty/">Facebook</SourceLink>
            </div>
          </article>
        </div>
      </section>

      <section id="record" className={styles.recordSection} aria-labelledby="record-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>The accountability ledger</p>
          <h2 id="record-heading">What is documented—and what is not yet resolved</h2>
          <p>Receipts lead. Conclusions follow. Missing records are shown instead of quietly filled with assumptions.</p>
        </header>

        <div className={styles.ledger}>
          <article className={styles.serviceLedger}>
            <p className={styles.ledgerLabel}>Documented public service</p>
            <h3>The record in favor</h3>
            <ul>
              <li>
                <strong>Regional leadership</strong>
                <span>Service on the East Texas CEO–RTPO board, executive committee and chair role is documented.</span>
              </li>
              <li>
                <strong>Water advocacy</strong>
                <span>Public reporting places LaFleur in the local opposition to a Lake O’ the Pines water sale.</span>
              </li>
              <li>
                <strong>Electoral standing</strong>
                <span>He is the incumbent Republican nominee after an uncontested 2026 primary.</span>
              </li>
            </ul>
          </article>

          <article className={styles.concernLedger}>
            <p className={styles.ledgerLabel}>Public-interest concern</p>
            <h3>Allegations denied; status unresolved</h3>
            <p className={styles.concernLead}>
              Two people reportedly alleged unwanted sexual touching arising from a 2025
              gathering. LaFleur denies both allegations.
            </p>
            <p>
              April reporting described prosecutorial review. RepWatchr has not located an
              arrest, indictment, conviction or final adjudication. The underlying complaint,
              docket, transfer records and current disposition remain on the records-request list.
            </p>
            <div className={styles.statusLine}>
              <span>Allegation</span>
              <span>Denial</span>
              <span>Review reported</span>
              <strong>No final finding located</strong>
            </div>
            <div className={styles.responseLinks}>
              <SourceLink href="https://www.kltv.com/2026/04/21/marion-county-judge-denies-allegations-unwanted-touching-halloween-party/">
                Read the KLTV report and denial
              </SourceLink>
              <a href="mailto:tips@repwatchr.com?subject=Marion%20County%20Judge%20source">
                Submit a primary record
              </a>
            </div>
          </article>
        </div>

        <div className={styles.authorityBand}>
          <div>
            <p className={styles.eyebrow}>What the office controls</p>
            <h3>This is not only a courtroom job.</h3>
          </div>
          <dl>
            <div><dt>County budget</dt><dd>Presides over Commissioners Court</dd></div>
            <div><dt>Emergency management</dt><dd>Countywide coordination and declarations</dd></div>
            <div><dt>Public administration</dt><dd>Contracts, priorities and intergovernmental work</dd></div>
            <div><dt>County court</dt><dd>Criminal and probate jurisdiction listed by Texas OCA</dd></div>
          </dl>
        </div>
      </section>

      <section id="community-poll" className={styles.pollSection} aria-labelledby="poll-heading">
        <div className={styles.pollIntro}>
          <p className={styles.sectionNumber}>02</p>
          <div>
            <p className={styles.eyebrow}>Marion County community pulse</p>
            <h2 id="poll-heading">If the election were today, who would you support?</h2>
            <p>
              Everyone may participate. Results are segmented by server-verified residence so
              Marion County voices can be viewed separately from outside and unverified responses.
            </p>
          </div>
        </div>
        <RaceCommunityPoll
          enabled={pollEnabled}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />
      </section>

      <section id="method" className={styles.methodSection} aria-labelledby="method-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>How the grade works</p>
          <h2 id="method-heading">A county judge is graded on the job—not on applause.</h2>
          <p>
            Community sentiment is displayed beside the record but never enters the grade.
            Allegations affect the grade only after an authoritative finding or authenticated
            primary record supports a rules-based deduction.
          </p>
        </header>
        <div className={styles.scoreGrid}>
          <div className={styles.gradeDial}>
            <span>NR</span>
            <strong>Not rated</strong>
            <p>Minimum evidence threshold not met</p>
          </div>
          <div className={styles.scoreRows}>
            {scoringRows.map(([label, weight, evidence]) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{weight}</span>
                <p>{evidence}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.methodLink}>
          <Link href="/methodology">Read the full scoring and correction method</Link>
        </div>
      </section>

      <section className={styles.timelineSection} aria-labelledby="timeline-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Race timeline</p>
          <h2 id="timeline-heading">Four moments define the public record so far</h2>
        </header>
        <ol className={styles.timeline}>
          <li><time>Mar. 3</time><strong>LaFleur wins unopposed GOP primary</strong><p>Official final result: 1,079 votes and 594 undervotes.</p></li>
          <li><time>Apr. 21</time><strong>Second allegation reported</strong><p>Reporting describes two accusers, LaFleur’s denial and prosecutorial review.</p></li>
          <li><time>Jul. 9</time><strong>Carroll announces write-in challenge</strong><p>Her campaign enters the race; official qualification remains to be verified.</p></li>
          <li><time>Nov. 3</time><strong>General election</strong><p>Only official Marion County results determine the office.</p></li>
        </ol>
      </section>

      <section id="discussion" className={styles.discussionSection} aria-labelledby="discussion-heading">
        <div className={styles.discussionTop}>
          <div>
            <p className={styles.eyebrow}>Public square</p>
            <h2 id="discussion-heading">Question the record. Bring receipts.</h2>
            <p>Facebook, X and email sign-in are supported. Sourced comments rank above unsupported claims.</p>
          </div>
          <ShareButtons
            title="Dina Carroll vs. Leward LaFleur | Marion County Judge 2026"
            description="Compare the candidates, inspect the record and join the Marion County community pulse."
            path={RACE_PATH}
            template="public_question"
            subject="Marion County Judge race"
            sourceLabel="official filings, public records and attributed reporting"
          />
        </div>
        <CommentSection
          officialId="race:marion-county-judge-2026"
          officialName="the Marion County Judge race"
          storyMode
          targetPath={`${RACE_PATH}#discussion`}
        />
      </section>

      <section id="sources" className={styles.sourcesSection} aria-labelledby="sources-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Source room</p>
          <h2 id="sources-heading">Open the same material RepWatchr reviewed</h2>
          <p>Each claim above should remain traceable, correctable and time-stamped.</p>
        </header>
        <ol className={styles.sources}>
          {sources.map((source, index) => (
            <li key={source.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <SourceLink href={source.href}>{source.label}</SourceLink>
              <small>{source.type}</small>
            </li>
          ))}
        </ol>
        <p className={styles.correction}>
          Have a docket, complaint, disposition, Commissioners Court record or correction?
          <a href="mailto:tips@repwatchr.com?subject=Marion%20County%20Judge%20evidence"> Send it to the evidence desk.</a>
        </p>
      </section>
    </main>
  );
}
