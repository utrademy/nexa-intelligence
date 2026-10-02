import { ArrowRight, CircleAlert, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { AiInsight } from "@/lib/types";
import { cn } from "@/lib/format";

const SEVERITY = {
  critical: { icon: CircleAlert, tone: "text-rose-600 bg-rose-50 ring-rose-600/10", label: "Crítico", metric: "text-rose-600" },
  opportunity: { icon: TrendingUp, tone: "text-indigo-600 bg-indigo-50 ring-indigo-600/10", label: "Oportunidad", metric: "text-indigo-600" },
  info: { icon: Lightbulb, tone: "text-cyan-700 bg-cyan-50 ring-cyan-600/10", label: "Hallazgo", metric: "text-cyan-700" },
};

export function AiInsightCard({ insight, href = "/people" }: { insight: AiInsight; href?: string }) {
  const s = SEVERITY[insight.severity];
  return (
    <div className="group rounded-xl border border-slate-200/70 bg-white p-4 transition hover:border-indigo-200 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.35)]">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", s.tone)}>
          <s.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
            {insight.metric && <span className={cn("text-[15px] font-semibold tabular-nums", s.metric)}>{insight.metric}</span>}
          </div>
          <div className="mt-0.5 text-[13.5px] font-semibold text-slate-900">{insight.title}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{insight.description}</p>
          {insight.action && (
            <Link href={href} className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-indigo-600 transition group-hover:gap-1.5">
              {insight.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
