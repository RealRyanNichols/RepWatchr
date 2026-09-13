import { coverArtFor, coverHash, starPoints, type CoverPalette } from "@/lib/generated-cover";

/**
 * Cover art drawn for articles that ship without a photograph.
 *
 * Pure inline SVG: nothing to fetch, nothing to 404, and it scales from a
 * 190px phone card to a 520px desktop hero. The motifs stay in the record
 * family - documents, ballots, district maps, the Capitol, the seal, the star.
 * Artwork only: the location chip and headline are real text drawn over it.
 */

const VARIANT_SHIFT = [0, -48, 42];

type MotifProps = { palette: CoverPalette; variant: number };

function Ledger({ palette, variant }: MotifProps) {
  const lines = [246, 214, 236, 182, 224, 196];
  return (
    <g transform={`translate(${VARIANT_SHIFT[variant] - 40} 0)`}>
      <rect x={700} y={22} width={318} height={416} rx={4} fill={palette.accent} fillOpacity={0.05} stroke={palette.accent} strokeOpacity={0.16} strokeWidth={2} transform="rotate(-9 859 230)" />
      <rect x={728} y={42} width={318} height={416} rx={4} fill={palette.accent} fillOpacity={0.07} stroke={palette.accent} strokeOpacity={0.22} strokeWidth={2} transform="rotate(-4 887 250)" />
      <g transform="rotate(3 915 270)">
        <rect x={756} y={62} width={318} height={416} rx={4} fill={palette.accent} fillOpacity={0.1} stroke={palette.accent} strokeOpacity={0.34} strokeWidth={2.5} />
        <rect x={786} y={98} width={182} height={13} fill={palette.accent} fillOpacity={0.52} />
        {lines.map((width, index) => (
          <rect key={index} x={786} y={142 + index * 38} width={width} height={7} rx={3.5} fill={palette.accent} fillOpacity={index === 3 ? 0.5 : 0.2} />
        ))}
      </g>
    </g>
  );
}

function Star({ palette, variant }: MotifProps) {
  const cx = 862 + VARIANT_SHIFT[variant];
  const cy = 248;
  return (
    <g>
      <circle cx={cx} cy={cy} r={262} fill="none" stroke={palette.accent} strokeOpacity={0.1} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={228} fill="none" stroke={palette.accent} strokeOpacity={0.17} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={216} fill="none" stroke={palette.accent} strokeOpacity={0.09} strokeWidth={1.5} />
      <polygon points={starPoints(cx, cy, 185, 74)} fill={palette.accent} fillOpacity={0.09} stroke={palette.accent} strokeOpacity={0.44} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
}

function Dome({ palette, variant }: MotifProps) {
  return (
    <g transform={`translate(${VARIANT_SHIFT[variant] - 34} 0)`}>
      <rect x={628} y={430} width={530} height={14} fill={palette.accent} fillOpacity={0.16} />
      <rect x={650} y={412} width={486} height={14} fill={palette.accent} fillOpacity={0.22} />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <rect key={index} x={676 + index * 67} width={25} y={312} height={96} fill={palette.accent} fillOpacity={0.2} />
      ))}
      <rect x={660} y={291} width={466} height={21} fill={palette.accent} fillOpacity={0.28} />
      <rect x={792} y={222} width={202} height={70} fill={palette.accent} fillOpacity={0.16} />
      <path d="M792 224 C792 100 994 100 994 224 Z" fill={palette.accent} fillOpacity={0.14} stroke={palette.accent} strokeOpacity={0.4} strokeWidth={3} />
      <rect x={882} y={148} width={22} height={38} fill={palette.accent} fillOpacity={0.3} />
      <polygon points={starPoints(893, 120, 27, 11)} fill={palette.accent} fillOpacity={0.55} />
    </g>
  );
}

function Ballot({ palette, variant }: MotifProps) {
  const widths = [252, 212, 278, 198, 240];
  const marked = variant + 1;
  return (
    <g transform={`translate(${VARIANT_SHIFT[variant] / 2 - 30} 0)`}>
      {widths.map((width, index) => {
        const y = 88 + index * 76;
        const isMarked = index === marked;
        return (
          <g key={index}>
            <rect x={720} y={y} width={44} height={44} rx={3} fill={palette.accent} fillOpacity={isMarked ? 0.18 : 0} stroke={palette.accent} strokeOpacity={0.36} strokeWidth={3} />
            {isMarked ? (
              <path d={`M${730} ${y + 23} L${739} ${y + 33} L${755} ${y + 11}`} fill="none" stroke={palette.accent} strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            <rect x={788} y={y + 13} width={width} height={18} rx={4} fill={palette.accent} fillOpacity={isMarked ? 0.3 : 0.12} />
          </g>
        );
      })}
    </g>
  );
}

function DistrictMap({ palette, variant }: MotifProps) {
  const cx = 858 + VARIANT_SHIFT[variant];
  const cy = 248;
  return (
    <g>
      <g stroke={palette.accent} strokeOpacity={0.07} strokeWidth={1.5}>
        {Array.from({ length: 16 }, (_, index) => (
          <line key={`v${index}`} x1={index * 75} y1={0} x2={index * 75} y2={630} />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <line key={`h${index}`} x1={0} y1={index * 70} x2={1200} y2={index * 70} />
        ))}
      </g>
      <polygon
        points={`${cx - 182},108 ${cx + 66},80 ${cx + 190},182 ${cx + 164},324 ${cx + 13},422 ${cx - 146},376 ${cx - 217},250`}
        fill={palette.accent}
        fillOpacity={0.1}
        stroke={palette.accent}
        strokeOpacity={0.46}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={43} fill="none" stroke={palette.accent} strokeOpacity={0.18} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={24} fill="none" stroke={palette.accent} strokeOpacity={0.42} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={10} fill={palette.accent} fillOpacity={0.85} />
    </g>
  );
}

function Seal({ palette, variant }: MotifProps) {
  const cx = 860 + VARIANT_SHIFT[variant];
  const cy = 244;
  return (
    <g>
      <circle cx={cx} cy={cy} r={218} fill="none" stroke={palette.accent} strokeOpacity={0.13} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={184} fill="none" stroke={palette.accent} strokeOpacity={0.32} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={136} fill={palette.accent} fillOpacity={0.05} stroke={palette.accent} strokeOpacity={0.14} strokeWidth={1.5} />
      <g stroke={palette.accent} strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round">
        {Array.from({ length: 36 }, (_, index) => {
          const angle = (index * 10 * Math.PI) / 180;
          return (
            <line
              key={index}
              x1={(cx + 190 * Math.cos(angle)).toFixed(1)}
              y1={(cy + 190 * Math.sin(angle)).toFixed(1)}
              x2={(cx + 213 * Math.cos(angle)).toFixed(1)}
              y2={(cy + 213 * Math.sin(angle)).toFixed(1)}
            />
          );
        })}
      </g>
      <polygon points={starPoints(cx, cy, 87, 35)} fill={palette.accent} fillOpacity={0.14} stroke={palette.accent} strokeOpacity={0.44} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

const MOTIF_COMPONENTS = {
  ledger: Ledger,
  star: Star,
  dome: Dome,
  ballot: Ballot,
  map: DistrictMap,
  seal: Seal,
} as const;

export default function GeneratedCover({
  coverKey,
  scope,
  visualTheme,
  className = "",
}: {
  coverKey: string;
  scope?: string;
  visualTheme?: string;
  className?: string;
}) {
  const { motif, palette, variant } = coverArtFor({ key: coverKey, scope, visualTheme });
  const Motif = MOTIF_COMPONENTS[motif];
  const id = `rw-cover-${coverHash(`${coverKey}:${motif}`).toString(36)}`;

  return (
    <svg
      className={className}
      viewBox="0 0 1200 630"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-generated-cover={motif}
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.mid} />
          <stop offset="70%" stopColor={palette.base} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.78" cy="0.16" r="0.72">
          <stop offset="0%" stopColor={palette.glow} stopOpacity={0.85} />
          <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={palette.accent} fillOpacity={0.07} />
        </pattern>
      </defs>
      <rect width="1200" height="630" fill={`url(#${id}-wash)`} />
      <rect width="1200" height="630" fill={`url(#${id}-glow)`} />
      <rect width="1200" height="630" fill={`url(#${id}-dots)`} />
      <Motif palette={palette} variant={variant} />
      <rect x="0" y="0" width="1200" height="6" fill={palette.rule} fillOpacity={0.9} />
    </svg>
  );
}
