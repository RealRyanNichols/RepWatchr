import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Performance Grade Method | RepWatchr",
    description:
      "How RepWatchr grades documented job performance while keeping ideology, popularity, and participant sentiment separate.",
    path: "/methodology",
    imagePath: buildOgImageUrl("methodology"),
    imageAlt: "RepWatchr performance grade methodology",
  }),
};

const dimensions = [
  {
    name: "Voting accountability",
    weight: 20,
    question: "Did the official take a documented position when eligible, regardless of whether the vote was yea or nay?",
  },
  {
    name: "Legislative effectiveness",
    weight: 25,
    question: "Did the official turn comparable opportunities into substantive, documented outcomes?",
  },
  {
    name: "Ethics and integrity",
    weight: 25,
    question: "What do final authoritative findings and required filings establish?",
  },
  {
    name: "Constituent service and transparency",
    weight: 20,
    question: "Is the office objectively accessible, responsive, and compliant with transparency duties?",
  },
  {
    name: "Attendance and duty fulfillment",
    weight: 10,
    question: "Did the official attend eligible duties after approved leave and official conflicts are excluded?",
  },
] as const;

const sourceTiers = [
  ["Tier 1", "1.0", "Official roll calls, journals, filings, audits, final ethics orders, and court records."],
  ["Tier 2", "0.9", "Official transcripts, meeting video, agency datasets, and direct official statements."],
  ["Tier 3", "0.7", "Named independent reporting tied to primary records or independently corroborated."],
  ["Tier 4", "0.4", "Campaign, advocacy, and social material—proof of the speaker's statement, not proof that an accusation is true."],
  ["Unverified", "0", "A research lead only. It cannot move a score."],
] as const;

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f8fbff] text-slate-950">
      <section className="overflow-hidden bg-[#061735] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">Performance grade • method v1.0</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl">
            Grade the job. Never grade the party.
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            RepWatchr&apos;s overall grade measures documented execution of public duties. Ideology, party loyalty,
            fundraising, follower counts, press volume, and community popularity do not change it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/officials" className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-200">
              Browse profiles
            </Link>
            <a href="#publication-gates" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">
              See publication gates
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <MethodHeading
          eyebrow="First principle"
          title="One profile. Three outputs that never contaminate one another."
          description="This separation prevents popularity or editorial preference from masquerading as job performance."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <MethodCard
            number="01"
            title="Verified performance grade"
            body="A 0–100 job-performance score. A letter appears only after the same evidence gates clear for comparable officials."
            tone="blue"
          />
          <MethodCard
            number="02"
            title="Vote and issue alignment"
            body="The sourced vote plus an optional comparison to a member's own priorities. Policy direction never changes the performance grade."
            tone="amber"
          />
          <MethodCard
            number="03"
            title="Participant sentiment"
            body="A separate, self-selected community signal. It is not a scientific poll, endorsement, or performance input."
            tone="green"
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="The five dimensions"
            title="Every point answers a neutral job-performance question."
            description="A yea and a nay are not scored as morally correct or incorrect. Missing evidence is never converted into a zero, a 50, or a guess."
          />
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
            {dimensions.map((dimension, index) => (
              <article
                key={dimension.name}
                className={`grid gap-4 p-5 sm:grid-cols-[4rem_15rem_minmax(0,1fr)] sm:items-center sm:p-6 ${
                  index ? "border-t border-slate-200" : ""
                }`}
              >
                <p className="text-3xl font-black tracking-[-0.05em] text-blue-800">{dimension.weight}%</p>
                <h2 className="text-base font-black text-slate-950">{dimension.name}</h2>
                <p className="text-sm font-semibold leading-6 text-slate-600">{dimension.question}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="publication-gates" className="scroll-mt-24 bg-[linear-gradient(180deg,#eef5ff,#f8fbff)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="Publication gates"
            title="A grade is withheld until the evidence can defend it."
            description="NR is not a favor or a punishment. It means the record has not cleared the same published gate required for everyone else."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <GateCard
              label="Full number + letter"
              value="80%+"
              body="At least 80% of planned weight scoreable, 70% weighted coverage, 65% confidence, four categories, and ethics scoreable."
            />
            <GateCard
              label="Provisional number"
              value="60%+"
              body="At least 60% of planned weight scoreable and 45% confidence. The number is labeled provisional and receives no letter."
            />
            <GateCard
              label="Not rated"
              value="NR"
              body="Below the provisional gate: no numeric score, no letter, and a visible checklist of the evidence that is still missing."
            />
          </div>
          <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Missing data rule</p>
                <h2 className="mt-2 text-2xl font-black">Confidence explains uncertainty. It does not punish the official.</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                  Category confidence combines coverage, source quality, freshness, and reliability. It is displayed
                  beside the score and never multiplied into the official&apos;s performance.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-xs leading-6 text-blue-100">
                confidence = coverage ×<br />
                (0.50 source quality +<br />
                0.25 freshness +<br />
                0.25 reliability)
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="Evidence and due process"
            title="Allegations may be reported. They never become deductions by repetition."
            description="Only final court orders, authorized ethics findings, audits, or equivalent authoritative dispositions can reduce the ethics score."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              {sourceTiers.map(([tier, quality, use], index) => (
                <div key={tier} className={`grid gap-2 p-5 sm:grid-cols-[7rem_4rem_minmax(0,1fr)] ${index ? "border-t border-slate-200" : ""}`}>
                  <p className="font-black text-slate-950">{tier}</p>
                  <p className="font-mono text-sm font-black text-blue-800">{quality}</p>
                  <p className="text-sm font-semibold leading-6 text-slate-600">{use}</p>
                </div>
              ))}
            </div>
            <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-900">Response and appeal</p>
              <ol className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-950">
                <li>1. Verify and classify the evidence.</li>
                <li>2. Notify the official of a score-moving integrity event or major score change.</li>
                <li>3. Allow ten business days for a response.</li>
                <li>4. Require a second reviewer for high-impact records.</li>
                <li>5. Publish the source, calculation, and response.</li>
                <li>6. Route appeals to a reviewer who did not make the first decision.</li>
              </ol>
              <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs font-black leading-5 text-amber-950">
                Pending, contested, or anonymous allegations have zero score effect.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <MethodHeading
            eyebrow="Community signal"
            title="Verified participant sentiment stays visible—and separate."
            description="One current response per verified member. In-district results are primary; other locations are labeled separately. Public results unlock at 25 eligible responses."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <p className="text-2xl font-black text-slate-950">Uncertainty shrinks toward neutral—not toward disapproval.</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                RepWatchr uses a neutral prior of 50 with a starting weight of 50 responses. Small coordinated samples
                therefore remain visibly uncertain instead of looking like a zero.
              </p>
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 font-mono text-xs font-bold leading-6 text-blue-950 sm:text-sm">
                sentiment = (n × raw average + 50 × 50) ÷ (n + 50)
              </div>
            </div>
            <div className="rounded-3xl bg-[#061735] p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Public label</p>
              <p className="mt-4 text-2xl font-black leading-8">Verified participant sentiment</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">Not an election. Not a scientific poll. Never part of the performance grade.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <MethodHeading
          eyebrow="Letter scale"
          title="One scale everywhere. No invented precision."
          description="Version 1 uses whole-letter grades only. The evidence does not justify plus/minus theater."
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["A", "90–100", "bg-emerald-600"],
            ["B", "80–89", "bg-lime-600"],
            ["C", "70–79", "bg-amber-500"],
            ["D", "60–69", "bg-orange-600"],
            ["F", "0–59", "bg-red-600"],
          ].map(([grade, range, color]) => (
            <div key={grade} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-center">
              <p className={`${color} py-4 text-4xl font-black text-white`}>{grade}</p>
              <p className="px-3 py-3 text-sm font-black text-slate-700">{range}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-sm font-bold leading-6 text-blue-950">
            See a factual error or a missing source? Corrections create a new version instead of silently erasing the old calculation.
          </p>
          <Link href="/submit-source" className="mt-4 inline-flex rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900">
            Submit a source or correction
          </Link>
        </div>
      </section>
    </main>
  );
}

function MethodHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">{eyebrow}</p>
      <h2 className="mt-3 max-w-5xl text-3xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">{description}</p>
    </header>
  );
}

function MethodCard({
  number,
  title,
  body,
  tone,
}: {
  number: string;
  title: string;
  body: string;
  tone: "blue" | "amber" | "green";
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <article className={`rounded-3xl border p-6 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-65">{number}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-6 opacity-80">{body}</p>
    </article>
  );
}

function GateCard({ label, value, body }: { label: string; value: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">{label}</p>
      <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-slate-950">{value}</p>
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{body}</p>
    </article>
  );
}
