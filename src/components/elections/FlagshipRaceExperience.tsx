import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CommentSection from "@/components/comments/CommentSection";
import ShareButtons from "@/components/shared/ShareButtons";
import { repwatchrFeatureFlags } from "@/lib/repwatchr-feature-flags";
import RaceCommunityPoll from "./RaceCommunityPoll";
import styles from "./FlagshipRaceExperience.module.css";

const RACE_PATH = "/elections/texas/marion-county-judge-2026";
const VERIFIED_ON = "July 27, 2026";

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
  {
    label: "Dina Carroll campaign background",
    href: "https://writeindina.com/background.html",
    type: "Campaign",
  },
  {
    label: "Dina Carroll published beliefs and priorities",
    href: "https://writeindina.com/beliefs.html",
    type: "Campaign",
  },
  {
    label: "KSLA: Carroll teaching and animal-shelter volunteer work",
    href: "https://www.ksla.com/2018/12/12/homes-volunteers-desperately-needed-dogs-jefferson/",
    type: "Reporting",
  },
  {
    label: "KLTV: Carroll's role in a Jefferson dog rescue",
    href: "https://www.kltv.com/2025/03/16/webxtra-jefferson-residents-band-together-rescue-dog-well/",
    type: "Reporting",
  },
  {
    label: "ETCOG: Carroll named a 2024 Regional Citizen of the Year",
    href: "https://www.etcog.org/2024-regional-award-winners",
    type: "Official",
  },
  {
    label: "Marion County Judge official office",
    href: "https://www.co.marion.tx.us/page/marion.County.Judge",
    type: "Official",
  },
  {
    label: "Workforce Solutions East Texas: LaFleur regional leadership",
    href: "https://www.easttexasworkforce.org/new-leadership-announced-for-ceo-rtpo-board",
    type: "Official",
  },
  {
    label: "ETCOG: LaFleur biography and CEO–RTPO chair role",
    href: "https://www.etcog.org/etcog-announces-new-leadership-for-ceo-rtpo-board",
    type: "Official",
  },
  {
    label: "News-Journal: LaFleur's 2018 appointment as county judge",
    href: "https://news-journal.com/2018/08/30/marion-county-judge-lex-jones-retires-lafleur-appointed/",
    type: "Reporting",
  },
  {
    label: "Marion County: March 2026 disaster declaration",
    href: "https://www.co.marion.tx.us/upload/page/1263/2026/03-2026%20MC%20Disaster%20Declaration.pdf",
    type: "Official",
  },
  {
    label: "Texas Judicial Academy fellow announcement",
    href: "https://www.co.marion.tx.us/upload/page/1263/2021/Judge%20LaFleur%20Inducted%20as%20Fellow%20Press%20Release%208-21.pdf",
    type: "Official",
  },
  {
    label: "Texas Tribune: Lake O' the Pines water dispute",
    href: "https://www.texastribune.org/2025/04/17/east-texas-defends-water-lake-the-pines/",
    type: "Reporting",
  },
  {
    label: "Texas OCA: constitutional county-court jurisdiction",
    href: "https://www.txcourts.gov/media/1460595/constitutional-county-courts.pdf",
    type: "Official",
  },
  {
    label: "LaFleur public campaign page and portrait",
    href: "https://www.facebook.com/lewardformarioncounty/",
    type: "Photo source",
  },
  {
    label: "News Messenger: first allegation, referral history and LaFleur denial",
    href: "https://marshallnewsmessenger.com/2026/02/23/marion-county-judge-leward-lafleur-denies-groping-teen-at-party-visiting-judge-named-for-misdemeanor-case/",
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
  src,
  alt,
  credit,
  creditHref,
  position,
  resolution,
}: {
  src: string;
  alt: string;
  credit: string;
  creditHref: string;
  position: string;
  resolution: string;
}) {
  return (
    <figure className={styles.portrait}>
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        sizes="(max-width: 960px) 100vw, 560px"
        className={styles.portraitImage}
        style={{ objectPosition: position }}
      />
      <figcaption>
        <span>Highest verified public image · {resolution}</span>
        <a href={creditHref} target="_blank" rel="noopener noreferrer">
          {credit}
          <span className={styles.externalMark} aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
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

function HeroCandidate({
  href,
  src,
  alt,
  status,
  name,
  role,
  position,
}: {
  href: string;
  src: string;
  alt: string;
  status: string;
  name: string;
  role: string;
  position: string;
}) {
  return (
    <Link
      href={href}
      className={styles.heroCandidate}
      aria-label={`Open the full profile for ${name}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes="(max-width: 640px) 44vw, (max-width: 960px) 300px, 240px"
        className={styles.heroCandidateImage}
        style={{ objectPosition: position }}
      />
      <span className={styles.heroCandidateShade} aria-hidden="true" />
      <span className={styles.heroCandidateStatus}>{status}</span>
      <span className={styles.heroCandidateCopy}>
        <strong>{name}</strong>
        <small>{role}</small>
      </span>
    </Link>
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
                County budgets, emergencies, open meetings and the constitutional county
                court are on the ballot.
              </p>
              <div className={styles.heroActions}>
                <a href="#candidates" className={styles.primaryAction}>Compare profiles</a>
                <a href="#record" className={styles.secondaryAction}>See the evidence</a>
              </div>
            </div>

            <aside className={styles.heroMatchup} aria-label="Candidates and election status">
              <div className={styles.heroCandidates}>
                <HeroCandidate
                  href="/candidates/dina-k-carroll"
                  src="/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg"
                  alt="Dina K. Carroll holding a kitten"
                  status="Announced write-in · qualification pending"
                  name="Dina Carroll"
                  role="Challenger"
                  position="50% 38%"
                />
                <span className={styles.heroVersus} aria-hidden="true">VS</span>
                <HeroCandidate
                  href="/officials/leward-j-lafleur-ii"
                  src="/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg"
                  alt="Leward J. LaFleur II wearing a suit outside a stone-columned public building"
                  status="Republican nominee · incumbent"
                  name="Leward LaFleur"
                  role="County judge"
                  position="50% 30%"
                />
              </div>
              <div className={styles.electionStrip}>
                <div className={styles.electionDate}>
                  <span>General election</span>
                  <strong>Nov. 3, 2026</strong>
                </div>
                <dl className={styles.electionFacts}>
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
              </div>
            </aside>
          </div>
          <p className={styles.heroImageDisclosure}>
            Original editorial illustration · not documentary evidence
          </p>
        </div>
      </section>

      <nav className={styles.chapterNav} aria-label="Race page sections">
        <div>
          <a href="#candidates">Candidates</a>
          <a href="#profiles">Full profiles</a>
          <a href="#issues">Issue guide</a>
          <a href="#record">Accountability</a>
          <a href="#ballot">Ballot & money</a>
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
          <p className={styles.verificationStamp}>Source review updated {VERIFIED_ON}</p>
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
          <h2 id="candidate-heading">See the people—not campaign placeholders</h2>
          <p>
            Authentic public-facing images now sit beside sourced biographies, links and
            verification gaps. Campaign statements are labeled. Public records stay separate.
          </p>
        </header>

        <div className={styles.candidateGrid}>
          <article className={styles.candidate}>
            <CandidatePortrait
              src="/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg"
              alt="Dina K. Carroll holding a kitten"
              credit="Candidate image published by the Marshall News Messenger"
              creditHref="https://marshallnewsmessenger.com/2026/07/09/jefferson-community-advocate-announces-write-in-candidacy-for-marion-county-judge/"
              position="50% 38%"
              resolution="913 × 1,367"
            />
            <div className={styles.candidateBody}>
              <div className={styles.candidateIdentity}>
                <p>Announced write-in · qualification pending</p>
                <h3>Dina K. Carroll</h3>
                <span>Jefferson small-business owner, educator and community advocate</span>
              </div>
              <p className={styles.candidateLede}>
                Carroll’s campaign centers morality, open government and restoring trust.
                Independent reporting supports parts of her teaching, small-business and
                animal-welfare record; a detailed county-governance plan is still developing.
              </p>
              <dl className={styles.candidateFacts}>
                <div>
                  <dt>Public record</dt>
                  <dd>Teaching, small-business and animal-rescue work are independently reported.</dd>
                </div>
                <div>
                  <dt>Campaign message</dt>
                  <dd>“Morals matter,” transparency, accountability and respect for taxpayers.</dd>
                </div>
                <div>
                  <dt>Ballot status</dt>
                  <dd>Campaign says a declaration was filed; county acceptance is not yet located.</dd>
                </div>
                <div>
                  <dt>Party</dt>
                  <dd>No party affiliation located in the posted filing or campaign material.</dd>
                </div>
              </dl>
              <div className={styles.candidateLinks}>
                <Link href="/candidates/dina-k-carroll">Open full candidate profile</Link>
                <a href="#dina-profile">Read on-page dossier</a>
                <SourceLink href="https://writeindina.com/">Campaign website</SourceLink>
                <SourceLink href="https://www.facebook.com/writeindina/">Facebook</SourceLink>
                <SourceLink href="https://www.instagram.com/dcjcarroll2/">Instagram</SourceLink>
              </div>
            </div>
          </article>

          <div className={styles.versus} aria-hidden="true">
            <span>VS</span>
          </div>

          <article className={styles.candidate}>
            <CandidatePortrait
              src="/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg"
              alt="Leward J. LaFleur II wearing a suit outside a stone-columned public building"
              credit="Portrait from LaFleur's public campaign page"
              creditHref="https://www.facebook.com/lewardformarioncounty/"
              position="50% 30%"
              resolution="1,081 × 1,080"
            />
            <div className={styles.candidateBody}>
              <div className={styles.candidateIdentity}>
                <p>Republican nominee · incumbent</p>
                <h3>Leward J. LaFleur II</h3>
                <span>Marion County Judge since 2018 · U.S. Navy veteran</span>
              </div>
              <p className={styles.candidateLede}>
                LaFleur has an eight-year county record spanning emergency management,
                regional transportation and water advocacy. That record also includes
                unresolved reported allegations that he and his attorney deny.
              </p>
              <dl className={styles.candidateFacts}>
                <div>
                  <dt>Public record</dt>
                  <dd>County judge, regional workforce and transportation chair, water-board leader.</dd>
                </div>
                <div>
                  <dt>Election history</dt>
                  <dd>Won the 2018 GOP primary; unopposed in the 2022 and 2026 primaries.</dd>
                </div>
                <div>
                  <dt>Current concern</dt>
                  <dd>Two reported misconduct allegations are denied and procedurally unresolved.</dd>
                </div>
                <div>
                  <dt>2026 primary</dt>
                  <dd>1,079 votes; 594 Republican ballots left the contest blank.</dd>
                </div>
              </dl>
              <div className={styles.candidateLinks}>
                <Link href="/officials/leward-j-lafleur-ii">Open full official profile</Link>
                <a href="#lafleur-profile">Read on-page dossier</a>
                <SourceLink href="https://www.co.marion.tx.us/page/marion.County.Judge">Official office</SourceLink>
                <SourceLink href="https://www.facebook.com/lewardformarioncounty/">Facebook</SourceLink>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="profiles" className={styles.profileSection} aria-labelledby="profiles-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Full candidate dossiers</p>
          <h2 id="profiles-heading">Their own story, checked against outside records</h2>
          <p>
            Each profile uses the same structure: candidate-published biography, independently
            supported facts, stated priorities, public contact information and the records still missing.
          </p>
        </header>

        <div className={styles.profileGrid}>
          <article id="dina-profile" className={styles.profileCard}>
            <header className={styles.profileHeader}>
              <p>Challenger dossier</p>
              <h3>Dina K. Carroll</h3>
              <span>Candidate material reviewed alongside local reporting</span>
            </header>

            <div className={styles.profileNarrative}>
              <p className={styles.sourceLabel}>Candidate-published biography</p>
              <p>
                Carroll says she was born and raised in Marion County, is a college graduate and
                certified teacher, and has spent years working with community and animal-welfare
                organizations. Her campaign presents her as a political outsider running on faith,
                family, honesty, accountability and common sense.
              </p>
              <p className={styles.attribution}>
                That paragraph reflects Carroll’s campaign website; it is not presented as an
                independent RepWatchr endorsement.
              </p>
            </div>

            <div className={styles.profileColumns}>
              <section>
                <p className={styles.sourceLabel}>Supported outside the campaign</p>
                <ul>
                  <li>Local reporting identifies Carroll as a Jefferson small-business owner.</li>
                  <li>KSLA reported that she taught high-school English and volunteered with shelter dogs.</li>
                  <li>KLTV documented her role in organizing and entering a deep-well dog rescue.</li>
                  <li>ETCOG named Carroll and Paula Jimenez 2024 Regional Citizens of the Year.</li>
                  <li>The county election page posts her campaign-treasurer appointment.</li>
                </ul>
              </section>
              <section>
                <p className={styles.sourceLabel}>Published campaign priorities</p>
                <ul>
                  <li>Open government, public records and courthouse accountability.</li>
                  <li>Clearer visibility into contracts, grants and taxpayer spending.</li>
                  <li>Respect for citizens who question government without retaliation.</li>
                  <li>Support for families, teachers, law enforcement and animal welfare.</li>
                </ul>
              </section>
            </div>

            <div className={styles.gapBox}>
              <strong>Verification still needed</strong>
              <p>
                Accepted write-in declaration, fee or petition acceptance, degree and certification
                records, a county-budget plan, emergency-management plan and court-administration specifics.
              </p>
            </div>

            <footer className={styles.profileFooter}>
              <address>
                <span>Campaign contact</span>
                <a href="mailto:electdina@writeindina.com">electdina@writeindina.com</a>
                <a href="tel:+19036650053">903-665-0053</a>
                <span>PO Box 630 · Jefferson, TX 75657</span>
              </address>
              <div>
                <SourceLink href="https://writeindina.com/background.html">Read campaign biography</SourceLink>
                <SourceLink href="https://writeindina.com/beliefs.html">Read published beliefs</SourceLink>
              </div>
            </footer>
          </article>

          <article id="lafleur-profile" className={styles.profileCard}>
            <header className={styles.profileHeader}>
              <p>Incumbent dossier</p>
              <h3>Leward J. LaFleur II</h3>
              <span>Official records, public statements and independently reported history</span>
            </header>

            <div className={styles.profileNarrative}>
              <p className={styles.sourceLabel}>Verified public biography</p>
              <p>
                LaFleur is a U.S. Navy veteran who returned to East Texas and entered county
                leadership in 2018. Commissioners appointed him to complete the retiring county
                judge’s term that August after he won the Republican primary. He has since served
                as Marion County Judge and in regional workforce, transportation and water roles.
              </p>
              <p className={styles.attribution}>
                Personal family details published by his campaign are omitted here because they do
                not measure performance in office.
              </p>
            </div>

            <div className={styles.profileColumns}>
              <section>
                <p className={styles.sourceLabel}>Documented experience</p>
                <ul>
                  <li>Marion County Judge since 2018; current Republican nominee.</li>
                  <li>CEO–RTPO board member since 2018, executive committee since 2021 and chair since 2023.</li>
                  <li>Texas Judicial Academy fellow for education beyond statutory requirements.</li>
                  <li>Signed county disaster and burn-ban orders under emergency authority.</li>
                </ul>
              </section>
              <section>
                <p className={styles.sourceLabel}>Documented positions and projects</p>
                <ul>
                  <li>Opposed a proposed transfer of Lake O’ the Pines water rights.</li>
                  <li>Participated in regional passenger-rail planning through the CEO–RTPO coalition.</li>
                  <li>Chairs the East Texas Water Advisory Board, according to 2026 reporting.</li>
                  <li>No stand-alone 2026 campaign platform was located.</li>
                </ul>
              </section>
            </div>

            <div className={styles.gapBox}>
              <strong>Performance records still needed</strong>
              <p>
                Commissioners Court attendance and votes, budget and audit trend data, contracts,
                public-record response times, recusal history and current disposition records for
                the reported allegations.
              </p>
            </div>

            <footer className={styles.profileFooter}>
              <address>
                <span>Official office</span>
                <a href="mailto:leward.lafleur@co.marion.tx.us">leward.lafleur@co.marion.tx.us</a>
                <a href="tel:+19036653261">903-665-3261</a>
                <span>102 W. Austin, Room 205 · Jefferson, TX 75657</span>
              </address>
              <div>
                <Link href="/officials/leward-j-lafleur-ii">Open RepWatchr profile</Link>
                <SourceLink href="https://www.co.marion.tx.us/page/marion.County.Judge">Open official office page</SourceLink>
              </div>
            </footer>
          </article>
        </div>
      </section>

      <section id="issues" className={styles.issueSection} aria-labelledby="issues-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Issue-by-issue source guide</p>
          <h2 id="issues-heading">What each candidate has actually put on the record</h2>
          <p>
            “Not located” is intentional. RepWatchr does not invent a position because a candidate
            has not yet published one.
          </p>
        </header>

        <div className={styles.issueMatrix} role="table" aria-label="Candidate issue comparison">
          <div className={styles.issueHead} role="row">
            <span role="columnheader">County issue</span>
            <strong role="columnheader">Dina K. Carroll</strong>
            <strong role="columnheader">Leward J. LaFleur II</strong>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">Open records & contracts</span>
            <p role="cell"><b>Campaign position:</b> publish where money goes, who receives contracts and what grants require.</p>
            <p role="cell"><b>Record review:</b> no 2026 platform located; county response-time and contract data are still being gathered.</p>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">Budget & taxpayers</span>
            <p role="cell"><b>Campaign position:</b> transparency and respect for taxpayers; no line-item or tax-rate plan located.</p>
            <p role="cell"><b>Incumbent record:</b> presides over budget decisions; multi-year budget, audit and tax comparisons are pending.</p>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">Emergency management</span>
            <p role="cell"><b>Not located:</b> no detailed disaster-readiness or recovery plan found in published campaign material.</p>
            <p role="cell"><b>Documented action:</b> activated a March 2026 disaster declaration and later ended a burn ban.</p>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">County court</span>
            <p role="cell"><b>Campaign theme:</b> lawful, moral and accountable court leadership; no criminal/probate caseload plan located.</p>
            <p role="cell"><b>Incumbent record:</b> current constitutional county judge; docket, disposition and recusal metrics are pending.</p>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">Water & transportation</span>
            <p role="cell"><b>Not located:</b> no detailed Lake O’ the Pines, Caddo Lake, road or regional-transport plan found.</p>
            <p role="cell"><b>Documented position:</b> opposed the water-rights transfer and holds regional transport leadership roles.</p>
          </div>
          <div className={styles.issueRow} role="row">
            <span role="rowheader">Families & community</span>
            <p role="cell"><b>Campaign position:</b> protect children, respect parents, support teachers, law enforcement and animal welfare.</p>
            <p role="cell"><b>Not located:</b> no consolidated 2026 platform covering these topics was found.</p>
          </div>
        </div>
        <p className={styles.matrixNote}>
          Candidate-controlled positions were reviewed on {VERIFIED_ON}. Send a newer platform or
          primary record to <a href="mailto:tips@repwatchr.com?subject=Marion%20County%20candidate%20position">the evidence desk</a>.
        </p>
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
            <h3>Reported, denied and still unresolved</h3>
            <p className={styles.concernLead}>
              Two people reportedly alleged unwanted sexual touching arising from a 2025
              gathering. LaFleur denies both allegations.
            </p>
            <p>
              An initial complaint was classified by a special prosecutor as a fine-only Class C
              matter and sent to municipal court. After an adult made a new complaint, the city
              returned the matter for review of possible Class A charges. On April 21, the district
              attorney said LaFleur had not been charged. RepWatchr has not located a later public
              filing, dismissal, conviction, acquittal or final disposition.
            </p>
            <div className={styles.statusLine}>
              <span>Reported allegations</span>
              <span>Denials published</span>
              <span>Review last reported</span>
              <strong>No later disposition located</strong>
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

      <section id="ballot" className={styles.ballotSection} aria-labelledby="ballot-heading">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Ballot & money trail</p>
          <h2 id="ballot-heading">Who is qualified, what was filed and what voters can verify</h2>
          <p>
            Campaign language does not establish ballot access. Official acceptance, posted
            reports and final election results control.
          </p>
        </header>

        <div className={styles.ballotGrid}>
          <article className={styles.ballotCard}>
            <p className={styles.statusBadge}>Official result</p>
            <span className={styles.ballotCandidate}>Leward J. LaFleur II</span>
            <h3>Republican nominee</h3>
            <dl>
              <div><dt>2026 primary</dt><dd>Unopposed</dd></div>
              <div><dt>Votes</dt><dd>1,079</dd></div>
              <div><dt>Undervotes</dt><dd>594</dd></div>
              <div><dt>Evidence</dt><dd>Official final canvass</dd></div>
            </dl>
            <SourceLink href="https://marioncountytaxoffice.com/wp-content/uploads/2026/03/OFFICIAL-RESULTS-REPUBLICAN-PARTY.pdf">
              Open the official results
            </SourceLink>
          </article>

          <article className={styles.ballotCard}>
            <p className={`${styles.statusBadge} ${styles.pendingBadge}`}>Verification pending</p>
            <span className={styles.ballotCandidate}>Dina K. Carroll</span>
            <h3>Announced write-in challenger</h3>
            <dl>
              <div><dt>Treasurer form</dt><dd>Posted by county</dd></div>
              <div><dt>Declaration</dt><dd>Campaign says filed</dd></div>
              <div><dt>Fee or petition</dt><dd>Acceptance not located</dd></div>
              <div><dt>Qualified roster</dt><dd>Not yet located</dd></div>
            </dl>
            <SourceLink href="https://marioncountytaxoffice.com/wp-content/uploads/2026/07/CTA-D-CARROLL.pdf">
              Open the posted treasurer form
            </SourceLink>
          </article>

          <aside className={styles.moneyCard}>
            <p className={styles.sourceLabel}>Campaign finance watch</p>
            <h3>No totals without the reports.</h3>
            <p>
              RepWatchr has not published contribution, expenditure or donor totals for this race.
              The page will calculate them only from posted campaign-finance records and will link
              every total back to the filing.
            </p>
            <ul>
              <li>Candidate/officeholder reports</li>
              <li>Contributions and expenditures</li>
              <li>Major donor and vendor concentration</li>
              <li>Late or amended filing history</li>
            </ul>
            <SourceLink href="https://marioncountytaxoffice.com/elections/">
              Check Marion County filings
            </SourceLink>
          </aside>
        </div>

        <div className={styles.ballotNotice}>
          <strong>Status checked {VERIFIED_ON}</strong>
          <p>
            The Texas write-in filing window runs through 5 p.m. August 17, 2026. This page will
            update when Marion County publishes acceptance records or its qualified-write-in list.
          </p>
          <SourceLink href="https://www.sos.state.tx.us/elections/candidates/guide/2026/writein2026.shtml">
            Read the Texas write-in rules
          </SourceLink>
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
          <h2 id="timeline-heading">Six dates define the race</h2>
        </header>
        <ol className={styles.timeline}>
          <li><time>Feb. 23</time><strong>First allegation and denial reported</strong><p>Local reporting describes the referral history, LaFleur’s denial and a visiting judge.</p></li>
          <li><time>Mar. 3</time><strong>LaFleur wins unopposed GOP primary</strong><p>Official final result: 1,079 votes and 594 undervotes.</p></li>
          <li><time>Apr. 21</time><strong>Second allegation and renewed review reported</strong><p>The district attorney says LaFleur has not been charged; LaFleur’s attorney denies both allegations.</p></li>
          <li><time>Jul. 9</time><strong>Carroll announces write-in challenge</strong><p>Her campaign enters the race; official qualification remains to be verified.</p></li>
          <li><time>Aug. 17</time><strong>Write-in filing deadline</strong><p>Texas sets 5 p.m. as the deadline for declared write-in filings for the November election.</p></li>
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
          {" "}Candidate portraits are reproduced for identification in this editorial race guide,
          with the public source attached to each image. Rights holders may request a source or
          permissions review through the same desk.
        </p>
      </section>
    </main>
  );
}
