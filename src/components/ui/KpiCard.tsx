import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  Gauge,
  Minus,
  Percent,
  Phone,
  RefreshCw,
  Reply,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { Kpi } from "@/lib/types";
import { cn } from "@/lib/format";

const ICONS = {
  users: Users,
  phone: Phone,
  gauge: Gauge,
  alert: CircleAlert,
  sparkles: Sparkles,
  refresh: RefreshCw,
  target: Target,
  send: Send,
  reply: Reply,
  check: CircleCheck,
  percent: Percent,
};

const TONES = {
  indigo: "from-indigo-500/15 to-indigo-500/0 text-indigo-600 ring-indigo-500/20",
  emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 ring-emerald-500/20",
  amber: "from-amber-500/15 to-amber-500/0 text-amber-600 ring-amber-500/20",
  rose: "from-rose-500/15 to-rose-500/0 text-rose-600 ring-rose-500/20",
  violet: "from-violet-500/15 to-violet-500/0 text-violet-600 ring-violet-500/20",
  cyan: "from-cyan-500/15 to-cyan-500/0 text-cyan-600 ring-cyan-500/20",
  slate: "from-slate-500/10 to-slate-500/0 text-slate-600 ring-slate-500/20",
};

export function KpiCard({ kpi, index = 0 }: { kpi: Kpi; index?: number }) {
  const Icon = ICONS[kpi.icon];
  const tone = kpi.tone ?? "indigo";
  const positive = (kpi.trend === "up" && kpi.id !== "missing") || (kpi.trend === "down" && kpi.id === "missing");
  const TrendIcon = kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;

  return (
    <div
      className="group relative animate-slide-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-inset", TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {kpi.delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              kpi.trend === "flat" ? "bg-slate-100 text-slate-600" : positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {kpi.delta}
          </span>
        )}
      </div>
      <div className="mt-4 text-[26px] font-semibold tracking-tight text-slate-900 tabular-nums">{kpi.value}</div>
      <div className="mt-0.5 text-[13px] font-medium text-slate-600">{kpi.label}</div>
      {kpi.hint && <div className="mt-0.5 text-[12px] text-slate-400">{kpi.hint}</div>}
    </div>
  );
}
