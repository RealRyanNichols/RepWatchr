import { calculateLetterGrade, getScoreColor, getScoreDescription } from "@/lib/scoring";

const sizeConfig = {
  sm: { dimension: 80, strokeWidth: 6, fontSize: "text-lg", subSize: "text-xs" },
  md: { dimension: 120, strokeWidth: 8, fontSize: "text-3xl", subSize: "text-sm" },
  lg: { dimension: 160, strokeWidth: 10, fontSize: "text-4xl", subSize: "text-base" },
};

interface ScoreGaugeProps {
  score: number;
  letterGrade?: string;
  size?: "sm" | "md" | "lg";
}

export default function ScoreGauge({
  score,
  size = "md",
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const displayGrade = calculateLetterGrade(score);
  const scoreColor = getScoreColor(score);
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg
        width={config.dimension}
        height={config.dimension}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: scoreColor }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold leading-none ${config.fontSize}`}
          style={{ color: scoreColor }}
        >
          {displayGrade}
        </span>
        <span
          className={`mt-0.5 font-medium text-gray-500 dark:text-gray-400 ${config.subSize}`}
        >
          {score}
        </span>
        <span className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-gray-400">
          {getScoreDescription(score)}
        </span>
      </div>
    </div>
  );
}
