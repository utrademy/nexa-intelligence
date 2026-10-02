import { cn } from "@/lib/format";

export function scoreTone(score: number) {
  if (score >= 85) return { bar: "bg-emerald-500", text: "text-emerald-600", stroke: "#10b981" };
  if (score >= 60) return { bar: "bg-indigo-500", text: "text-indigo-600", stroke: "#6366f1" };
  if (score >= 45) return { bar: "bg-amber-500", text: "text-amber-600", stroke: "#f59e0b" };
  return { bar: "bg-rose-500", text: "text-rose-600", stroke: "#f43f5e" };
}

export function ProgressBar({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", barClassName ?? scoreTone(value).bar)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ScoreCell({ value }: { value: number }) {
  const tone = scoreTone(value);
  return (
    <div className="flex min-w-[110px] items-center gap-2.5">
      <ProgressBar value={value} className="w-16" />
      <span className={cn("text-[13px] font-semibold whitespace-nowrap tabular-nums", tone.text)}>{value} %</span>
    </div>
  );
}

export function CompletenessRing({
  value,
  size = 168,
  stroke = 12,
  label = "Completitud",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(value);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-ai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={value >= 85 ? tone.stroke : "url(#ring-ai)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1), stroke 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
          <span className="ml-0.5 text-2xl">%</span>
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
    </div>
  );
}
