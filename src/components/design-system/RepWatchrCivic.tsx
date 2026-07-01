"use client";

import { useMemo, useState, type ReactNode } from "react";

type Tone = "blue" | "red" | "gold" | "green" | "violet";
type GlassVariant = "default" | "raised" | "source" | "warning" | "danger" | "verified";
type Density = "normal" | "compact" | "roomy";

const toneClass: Record<Tone, string> = {
  blue: "border-[rgba(96,165,250,0.34)] text-[var(--rw-accent-civic)]",
  red: "border-[rgba(251,113,133,0.38)] text-[var(--rw-accent-risk)]",
  gold: "border-[rgba(214,179,90,0.42)] text-[var(--rw-accent-gold)]",
  green: "border-[rgba(34,197,94,0.34)] text-[var(--rw-accent-trust)]",
  violet: "border-[rgba(139,92,246,0.38)] text-[var(--rw-accent-purple)]",
};

const densityClass: Record<Density, string> = {
  compact: "p-3",
  normal: "p-[var(--rw-panel-padding)]",
  roomy: "p-7 sm:p-9",
};

const sourceLabelClass = {
  confirmed: "border-[var(--rw-border-verified)] bg-emerald-400/10 text-[var(--rw-accent-trust)]",
  sourceBacked: "border-[var(--rw-border-source)] bg-sky-400/10 text-[var(--rw-accent-source)]",
  publicQuestion: "border-[var(--rw-border-warning)] bg-amber-300/10 text-[var(--rw-accent-alert)]",
  needsSource: "border-[var(--rw-border-warning)] bg-yellow-300/10 text-[var(--rw-accent-gold)]",
  underReview: "border-[var(--rw-border-glass)] bg-blue-300/10 text-[var(--rw-accent-civic)]",
  correctionRequested: "border-[var(--rw-border-danger)] bg-rose-400/10 text-[var(--rw-accent-risk)]",
  opinion: "border-[rgba(167,139,250,0.42)] bg-violet-400/10 text-[var(--rw-accent-purple)]",
  allegation: "border-[var(--rw-border-danger)] bg-red-400/10 text-[var(--rw-accent-risk)]",
  insufficientData: "border-[var(--rw-border-muted)] bg-slate-400/10 text-[var(--rw-text-muted)]",
};

const sourceLabelText = {
  confirmed: "Confirmed public record",
  sourceBacked: "Source-backed claim",
  publicQuestion: "Public question",
  needsSource: "Needs source",
  underReview: "Under review",
  correctionRequested: "Correction requested",
  opinion: "Opinion",
  allegation: "Allegation",
  insufficientData: "Insufficient data",
};

export type SourceLabelVariant = keyof typeof sourceLabelClass;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://www.repwatchr.com${path.startsWith("/") ? path : `/${path}`}`;
}

export function CivicBackground({
  children,
  sourceGlow = true,
  className,
}: {
  children: ReactNode;
  sourceGlow?: boolean;
  className?: string;
}) {
  return (
    <section className={cx("rw-civic-background min-h-screen", sourceGlow && "rw-source-node-glow", className)}>
      {children}
    </section>
  );
}

export function CivicShell({ children, className }: { children: ReactNode; className?: string }) {
  return <CivicBackground className={cx("rw-civic-shell rw-civic-noise", className)}>{children}</CivicBackground>;
}

export function GlassPanel({
  children,
  variant = "default",
  glow = false,
  interactive = false,
  density = "normal",
  className,
  ariaLabel,
}: {
  children: ReactNode;
  variant?: GlassVariant;
  glow?: boolean;
  interactive?: boolean;
  density?: Density;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      data-variant={variant}
      aria-label={ariaLabel}
      className={cx(
        "rw-glass-panel rounded-[var(--rw-radius-xl)]",
        densityClass[density],
        glow && "shadow-[var(--rw-shadow-source)]",
        interactive && "rw-glass-interactive rw-focus-ring",
        className,
      )}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function SourceLabel({
  variant,
  children,
  className,
}: {
  variant: SourceLabelVariant;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center rounded-[var(--rw-radius-full)] border px-3 text-[var(--rw-type-small-label)] font-black uppercase tracking-[var(--rw-letter-label)]",
        sourceLabelClass[variant],
        className,
      )}
    >
      {children ?? sourceLabelText[variant]}
    </span>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  sourceLabel,
  tone = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  sourceLabel?: string;
  tone?: Tone;
}) {
  return (
    <GlassPanel variant="raised" density="normal" className={cx("rw-metric-card", toneClass[tone])}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-text-muted)]">
          {title}
        </p>
        {sourceLabel ? <SourceLabel variant="sourceBacked">{sourceLabel}</SourceLabel> : null}
      </div>
      <div className="mt-4 text-[length:var(--rw-type-dashboard-number)] font-black leading-none text-[var(--rw-text-primary)]">
        {value}
      </div>
      {subtitle || trend ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--rw-text-secondary)]">
          {subtitle ? <span>{subtitle}</span> : null}
          {trend ? <span className="rounded-full border border-current/30 px-2 py-1 text-xs uppercase">{trend}</span> : null}
        </div>
      ) : null}
    </GlassPanel>
  );
}

export function ElasticButton({
  children,
  className,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(
        "rw-elastic-button rw-focus-ring inline-flex min-h-11 items-center justify-center rounded-[var(--rw-radius-lg)] px-5 py-3 text-sm font-black uppercase tracking-wide text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function WatchButton({
  watched = false,
  loading = false,
  anonymous = false,
  onToggle,
  onAccountPrompt,
}: {
  watched?: boolean;
  loading?: boolean;
  anonymous?: boolean;
  onToggle?: () => void;
  onAccountPrompt?: () => void;
}) {
  const label = loading ? "Saving" : watched ? "Watching" : anonymous ? "Log in to watch" : "Watch";
  return (
    <button
      type="button"
      disabled={loading}
      onClick={anonymous ? onAccountPrompt : onToggle}
      className={cx(
        "rw-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--rw-radius-full)] border px-4 text-sm font-black uppercase tracking-wide transition",
        watched
          ? "border-[var(--rw-border-verified)] bg-emerald-400/12 text-[var(--rw-accent-trust)] shadow-[var(--rw-verified-glow)]"
          : "border-[var(--rw-border-source)] bg-sky-400/10 text-[var(--rw-accent-source)] hover:bg-sky-400/16",
        loading && "cursor-wait opacity-70",
      )}
    >
      <span className={cx("h-2.5 w-2.5 rounded-full", watched ? "bg-[var(--rw-accent-trust)]" : "bg-[var(--rw-accent-source)]", !loading && "rw-source-pulse")} />
      {label}
    </button>
  );
}

export function ShareButton({
  title,
  path,
  safeLine,
}: {
  title: string;
  path: string;
  safeLine?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rw-focus-ring inline-flex min-h-11 items-center justify-center rounded-[var(--rw-radius-full)] border border-[var(--rw-border-glass)] bg-white/8 px-4 text-sm font-black uppercase tracking-wide text-[var(--rw-text-primary)] hover:border-[var(--rw-border-source)]"
      >
        Share
      </button>
      {open ? <ShareDrawer title={title} path={path} safeLine={safeLine} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function ShareDrawer({
  title,
  path,
  safeLine,
  onClose,
}: {
  title: string;
  path: string;
  safeLine?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState("");
  const url = safeUrl(path);
  const line = safeLine ?? `${title} - RepWatchr source trail: ${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copy(value: string, label: string) {
    if (!navigator.clipboard?.writeText) {
      setCopied("unavailable");
      return;
    }
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: line, url });
      setCopied("native");
    } catch {
      setCopied("unavailable");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto mt-20 max-w-lg">
        <GlassPanel variant="source" density="roomy" glow>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-accent-source)]">
                Share the receipt
              </p>
              <h3 className="mt-2 text-2xl font-black text-[var(--rw-text-primary)]">{title}</h3>
            </div>
            <button type="button" onClick={onClose} className="rw-focus-ring rounded-full px-3 py-2 text-sm font-black text-[var(--rw-text-secondary)]">
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            <button type="button" onClick={() => copy(url, "link")} className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-4 py-3 text-left font-bold">
              {copied === "link" ? "Copied link" : "Copy clean link"}
            </button>
            <button type="button" onClick={() => copy(line, "line")} className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-4 py-3 text-left font-bold">
              {copied === "line" ? "Copied safe line" : "Copy safe share line"}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button type="button" onClick={nativeShare} className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-4 py-3 text-left font-bold">
                Native share
              </button>
            ) : null}
            <div className="grid grid-cols-3 gap-2">
              <a className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-3 py-3 text-center text-sm font-black" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer">
                X
              </a>
              <a className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-3 py-3 text-center text-sm font-black" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a className="rw-command-row rw-focus-ring rounded-[var(--rw-radius-lg)] px-3 py-3 text-center text-sm font-black" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export function FeedbackButton({
  kind,
  onClick,
}: {
  kind: "useful" | "needs-source" | "broken-source" | "request-review" | "watching";
  onClick?: () => void;
}) {
  const label = {
    useful: "Useful",
    "needs-source": "Needs source",
    "broken-source": "Broken source",
    "request-review": "Request review",
    watching: "I'm watching",
  }[kind];
  const tone: Tone = kind === "useful" || kind === "watching" ? "green" : kind === "broken-source" ? "red" : "gold";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx("rw-focus-ring inline-flex min-h-10 items-center rounded-[var(--rw-radius-full)] border bg-white/6 px-3 text-xs font-black uppercase tracking-wide", toneClass[tone])}
    >
      {label}
    </button>
  );
}

export function ProfileCard({
  name,
  office,
  jurisdiction,
  sourceCount,
  completeness,
  trustLabel,
  href,
}: {
  name: string;
  office: string;
  jurisdiction: string;
  sourceCount: number;
  completeness: string;
  trustLabel: SourceLabelVariant;
  href: string;
}) {
  return (
    <a href={href} className="rw-3d-card rw-focus-ring block rounded-[var(--rw-radius-xl)] p-5 text-[var(--rw-text-primary)]">
      <div className="rw-aspect-profile-card rounded-[var(--rw-radius-lg)] border border-white/10 bg-gradient-to-br from-sky-400/18 via-slate-950/40 to-rose-400/18" />
      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[length:var(--rw-type-card-title)] font-black">{name}</h3>
          <p className="mt-1 text-sm font-bold text-[var(--rw-text-secondary)]">{office}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-[var(--rw-text-muted)]">{jurisdiction}</p>
        </div>
        <SourceLabel variant={trustLabel} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-black">
        <div className="rounded-[var(--rw-radius-md)] border border-white/10 bg-white/6 p-3">
          {sourceCount}<span className="block text-xs text-[var(--rw-text-muted)]">sources</span>
        </div>
        <div className="rounded-[var(--rw-radius-md)] border border-white/10 bg-white/6 p-3">
          {completeness}<span className="block text-xs text-[var(--rw-text-muted)]">complete</span>
        </div>
      </div>
    </a>
  );
}

export function OfficialHero({
  name,
  office,
  jurisdiction,
  confidence,
  sourceCount,
  completeness,
  children,
}: {
  name: string;
  office: string;
  jurisdiction: string;
  confidence: SourceLabelVariant;
  sourceCount: number;
  completeness: number;
  children?: ReactNode;
}) {
  const ring = `conic-gradient(var(--rw-accent-source) ${Math.max(0, Math.min(100, completeness))}%, rgba(255,255,255,0.12) 0)`;
  return (
    <GlassPanel variant="source" density="roomy" glow className="overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <SourceLabel variant={confidence} />
          <h1 className="mt-4 text-[length:var(--rw-type-display-hero)] font-black leading-none text-[var(--rw-text-primary)]">
            {name}
          </h1>
          <p className="mt-4 text-xl font-bold text-[var(--rw-text-secondary)]">{office}</p>
          <p className="mt-2 font-mono text-sm uppercase tracking-wide text-[var(--rw-accent-gold)]">{jurisdiction}</p>
          {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
        </div>
        <div className="grid place-items-center gap-3">
          <div className="grid h-36 w-36 place-items-center rounded-full p-2" style={{ background: ring }}>
            <div className="grid h-full w-full place-items-center rounded-full bg-[var(--rw-background-deep)] text-center">
              <span className="text-4xl font-black">{completeness}%</span>
              <span className="-mt-7 text-xs font-black uppercase tracking-wide text-[var(--rw-text-muted)]">complete</span>
            </div>
          </div>
          <p className="font-mono text-sm font-black text-[var(--rw-accent-source)]">{sourceCount} sources</p>
        </div>
      </div>
    </GlassPanel>
  );
}

export function SourceTrail({
  sources,
}: {
  sources: Array<{ title: string; type: string; date?: string; confidence: SourceLabelVariant; href: string }>;
}) {
  return (
    <GlassPanel variant="source" density="normal">
      <h3 className="text-2xl font-black text-[var(--rw-text-primary)]">Source trail</h3>
      <div className="relative mt-5 grid gap-4">
        <span className="rw-source-trail-line absolute bottom-4 left-3 top-4 w-0.5 rounded-full" aria-hidden />
        {sources.map((source) => (
          <a key={`${source.href}-${source.title}`} href={source.href} target="_blank" rel="noreferrer" className="rw-command-row rw-focus-ring relative grid gap-2 rounded-[var(--rw-radius-lg)] p-4 pl-10">
            <span className="absolute left-[7px] top-5 h-3.5 w-3.5 rounded-full bg-[var(--rw-accent-source)] shadow-[var(--rw-source-glow)]" />
            <div className="flex flex-wrap items-center gap-2">
              <SourceLabel variant={source.confidence} />
              <span className="font-mono text-xs uppercase text-[var(--rw-text-muted)]">{source.type}{source.date ? ` / ${source.date}` : ""}</span>
            </div>
            <p className="font-bold text-[var(--rw-text-primary)]">{source.title}</p>
          </a>
        ))}
      </div>
    </GlassPanel>
  );
}

export function TimelineEvent({
  date,
  title,
  source,
  trustLabel = "sourceBacked",
  relatedEntity,
  children,
}: {
  date?: string;
  title: string;
  source: string;
  trustLabel?: SourceLabelVariant;
  relatedEntity?: string;
  children: ReactNode;
}) {
  return (
    <article className="rw-timeline-event relative rounded-[var(--rw-radius-xl)] p-6 pl-16 text-[var(--rw-text-primary)]">
      <span className="absolute left-6 top-7 h-5 w-5 rounded-full bg-[var(--rw-accent-gold)] shadow-[var(--rw-warning-glow)]" />
      <div className="flex flex-wrap items-center gap-2">
        <SourceLabel variant={trustLabel} />
        {date ? <span className="font-mono text-xs uppercase text-[var(--rw-text-muted)]">{date}</span> : null}
      </div>
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mt-2 text-xs font-black uppercase tracking-wide text-[var(--rw-accent-source)]">
        {source}{relatedEntity ? ` / ${relatedEntity}` : ""}
      </p>
      <div className="mt-5 text-sm font-semibold leading-6 text-[var(--rw-text-secondary)]">{children}</div>
    </article>
  );
}

export function StickyActionRail({ actions }: { actions: Array<{ label: string; href: string }> }) {
  return (
    <aside className="sticky top-28 hidden w-16 shrink-0 flex-col gap-2 lg:flex" aria-label="Record actions">
      {actions.map((action) => (
        <a key={action.label} href={action.href} className="rw-focus-ring grid min-h-14 place-items-center rounded-[var(--rw-radius-lg)] border border-[var(--rw-border-glass)] bg-white/8 text-[10px] font-black uppercase tracking-wide text-[var(--rw-text-primary)] [writing-mode:vertical-rl] hover:border-[var(--rw-border-source)]">
          {action.label}
        </a>
      ))}
    </aside>
  );
}

export function MobileActionDock({ actions }: { actions: Array<{ label: string; href: string }> }) {
  return (
    <nav className="rw-mobile-action-dock fixed inset-x-0 bottom-0 z-50 border-t border-[var(--rw-border-glass)] bg-slate-950/88 px-2 pt-2 backdrop-blur lg:hidden" aria-label="Mobile record actions">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {actions.slice(0, 5).map((action) => (
          <a key={action.label} href={action.href} className="rw-focus-ring grid min-h-12 place-items-center rounded-[var(--rw-radius-md)] text-[11px] font-black text-[var(--rw-text-secondary)] hover:bg-white/8 hover:text-[var(--rw-text-primary)]">
            {action.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function FloatingSearchShell({
  placeholder = "Search officials, boards, counties, agencies, votes, funding...",
  action = "Ask",
}: {
  placeholder?: string;
  action?: string;
}) {
  return (
    <div className="rw-floating-search grid gap-3 rounded-[var(--rw-radius-xl)] p-4 sm:grid-cols-[1fr_auto]">
      <div className="flex min-h-14 items-center rounded-[var(--rw-radius-lg)] px-2 text-base font-bold text-[var(--rw-text-primary)]">
        {placeholder}
      </div>
      <ElasticButton className="min-w-24">{action}</ElasticButton>
    </div>
  );
}

export function CommandPaletteShell({
  rows,
}: {
  rows: Array<{ label: string; kind: string; tone?: Tone }>;
}) {
  return (
    <GlassPanel variant="raised" density="normal" className="text-[var(--rw-text-primary)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black">Command palette</h3>
        <span className="rounded-[var(--rw-radius-md)] bg-[var(--rw-accent-gold)] px-3 py-1 text-xs font-black text-slate-950">
          CMD K
        </span>
      </div>
      <div className="rounded-[var(--rw-radius-lg)] border border-[var(--rw-border-glass)] bg-white/8 px-4 py-3 font-mono text-sm text-[var(--rw-text-muted)]">
        Search officials, votes, sources, counties, filings...
      </div>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <button
            key={`${row.kind}-${row.label}`}
            type="button"
            className="rw-command-row rw-focus-ring flex min-h-14 items-center justify-between rounded-[var(--rw-radius-lg)] px-4 text-left"
          >
            <span className="font-bold text-[var(--rw-text-primary)]">{row.label}</span>
            <span className={cx("text-xs font-black uppercase tracking-wide", toneClass[row.tone ?? "blue"])}>
              {row.kind}
            </span>
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

export const CommandPaletteList = CommandPaletteShell;

export function EmptyState({
  title,
  explanation,
  action,
  secondaryAction,
}: {
  title: string;
  explanation: string;
  action: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}) {
  return (
    <GlassPanel variant="warning" density="roomy" className="text-center">
      <SourceLabel variant="needsSource" />
      <h3 className="mt-4 text-3xl font-black text-[var(--rw-text-primary)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--rw-text-secondary)]">{explanation}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={action.href} className="rw-elastic-button rw-focus-ring inline-flex min-h-11 items-center rounded-[var(--rw-radius-lg)] px-5 text-sm font-black uppercase tracking-wide text-white">
          {action.label}
        </a>
        {secondaryAction ? (
          <a href={secondaryAction.href} className="rw-focus-ring inline-flex min-h-11 items-center rounded-[var(--rw-radius-lg)] border border-[var(--rw-border-glass)] bg-white/8 px-5 text-sm font-black uppercase tracking-wide text-[var(--rw-text-primary)]">
            {secondaryAction.label}
          </a>
        ) : null}
      </div>
    </GlassPanel>
  );
}

export function LoadingSkeleton({ variant = "dashboard" }: { variant?: "profile" | "table" | "dashboard" | "search" }) {
  const rows = variant === "table" ? 7 : variant === "search" ? 4 : 5;
  return (
    <GlassPanel variant="raised" density="normal" ariaLabel={`${variant} loading skeleton`}>
      <div className="rw-loading-shimmer h-8 w-1/2 rounded-full bg-white/10" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rw-loading-shimmer h-12 rounded-[var(--rw-radius-md)] bg-white/8" />
        ))}
      </div>
    </GlassPanel>
  );
}

export function DashboardPanel({
  title,
  metric,
  action,
  children,
}: {
  title: string;
  metric?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <GlassPanel variant="raised" density="normal">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-accent-source)]">{title}</p>
          {metric ? <p className="mt-3 text-[length:var(--rw-type-dashboard-number)] font-black leading-none">{metric}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </GlassPanel>
  );
}

export function AdminTable({
  columns,
  rows,
  filters,
}: {
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
  filters?: ReactNode;
}) {
  return (
    <GlassPanel variant="raised" density="compact" className="overflow-hidden">
      {filters ? <div className="border-b border-[var(--rw-border-muted)] p-3">{filters}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--rw-border-muted)] text-xs uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-text-muted)]">
              {columns.map((column) => (
                <th key={column} className="px-3 py-3 font-black">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-[var(--rw-border-muted)] last:border-b-0">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-[var(--rw-dense-table-spacing)] font-semibold text-[var(--rw-text-secondary)]">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

export function SourcePacketPreview({
  title,
  packet,
  label = "sourceBacked",
}: {
  title: string;
  packet: string;
  label?: SourceLabelVariant;
}) {
  async function copyPacket() {
    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(packet);
  }

  return (
    <GlassPanel variant="source" density="normal">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SourceLabel variant={label} />
          <h3 className="mt-3 text-2xl font-black">{title}</h3>
        </div>
        <button type="button" onClick={copyPacket} className="rw-focus-ring rounded-[var(--rw-radius-lg)] border border-[var(--rw-border-source)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--rw-accent-source)]">
          Copy
        </button>
      </div>
      <pre className="rw-aspect-document mt-5 overflow-auto rounded-[var(--rw-radius-lg)] border border-[var(--rw-border-muted)] bg-white/90 p-5 font-mono text-xs leading-5 text-slate-950">
        {packet}
      </pre>
    </GlassPanel>
  );
}

export function PackageInterestCard({
  title,
  price,
  description,
  href,
}: {
  title: string;
  price: string;
  description: string;
  href: string;
}) {
  return (
    <a href={href} className="rw-3d-card rw-focus-ring block rounded-[var(--rw-radius-xl)] p-6 text-[var(--rw-text-primary)]">
      <p className="text-xs font-black uppercase tracking-[var(--rw-letter-label)] text-[var(--rw-accent-gold)]">Package interest</p>
      <h3 className="mt-3 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-4xl font-black text-[var(--rw-accent-source)]">{price}</p>
      <p className="mt-4 text-sm font-semibold leading-6 text-[var(--rw-text-secondary)]">{description}</p>
      <span className="mt-6 inline-flex min-h-10 items-center rounded-[var(--rw-radius-full)] border border-[var(--rw-border-source)] px-4 text-xs font-black uppercase tracking-wide text-[var(--rw-accent-source)]">
        Request package
      </span>
    </a>
  );
}

export function LiveCounter({ value, label, tone = "blue" }: { value: string; label: string; tone?: Tone }) {
  return (
    <div className={cx("rw-live-counter rounded-[var(--rw-radius-xl)] p-6", toneClass[tone])}>
      <div className="text-4xl font-black text-[var(--rw-text-primary)]">{value}</div>
      <div className="mt-3 text-xs font-black uppercase tracking-wide">{label}</div>
      <div className="mt-5 h-0.5 rounded-full bg-current opacity-75" />
    </div>
  );
}

export function DossierCard({
  name,
  office,
  grade,
  stats,
  className,
}: {
  name: string;
  office: string;
  grade: string;
  stats: Array<{ label: string; value: string; tone?: Tone }>;
  className?: string;
}) {
  return (
    <article className={cx("rw-3d-card rounded-[var(--rw-radius-xl)] p-6 text-[var(--rw-text-primary)]", className)}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h3 className="text-3xl font-black">{name}</h3>
          <p className="mt-1 text-sm font-bold text-[var(--rw-text-secondary)]">{office}</p>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-full border border-[rgba(251,113,133,0.34)] bg-[rgba(127,29,29,0.44)] text-5xl font-black text-[var(--rw-accent-risk)] shadow-[var(--rw-shadow-danger)]">
          {grade}
        </div>
      </div>
      <div className="mt-8 grid gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cx("rounded-[var(--rw-radius-lg)] border bg-white/6 px-4 py-3 text-sm font-black", toneClass[stat.tone ?? "blue"])}>
            <span className="text-[var(--rw-text-primary)]">{stat.label}</span>
            <span className="float-right">{stat.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function HeatmapGrid({ values }: { values: Array<{ label: string; level: number; tone?: Tone }> }) {
  return (
    <GlassPanel variant="raised" density="normal">
      <h3 className="text-2xl font-black text-[var(--rw-text-primary)]">Interest heatmap</h3>
      <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-9">
        {values.map((value) => {
          const tone = value.tone ?? (value.level > 7 ? "red" : value.level > 4 ? "gold" : "blue");
          return (
            <div
              key={value.label}
              title={value.label}
              className={cx("rw-heat-cell aspect-[1.35] rounded-[var(--rw-radius-md)] border", toneClass[tone])}
              style={{ backgroundColor: `color-mix(in srgb, currentColor ${18 + value.level * 5}%, transparent)` }}
            />
          );
        })}
      </div>
    </GlassPanel>
  );
}

export function useSafeShareLine(title: string, path: string) {
  return useMemo(() => `${title} - RepWatchr source trail: ${safeUrl(path)}`, [path, title]);
}
