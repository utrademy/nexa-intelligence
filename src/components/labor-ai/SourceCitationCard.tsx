import { BookOpen, Database, FileText } from "lucide-react";
import { AREA_LABEL } from "@/lib/mock/knowledge";
import type { SourceCitation } from "@/lib/types";
import { cn } from "@/lib/format";

const AREA_TONE: Record<SourceCitation["area"], string> = {
  "labor-law": "text-indigo-700 bg-indigo-50",
  "social-security": "text-cyan-700 bg-cyan-50",
  osh: "text-amber-700 bg-amber-50",
  "sergio-flores": "text-violet-700 bg-violet-50",
  population: "text-emerald-700 bg-emerald-50",
};

export function SourceCitationCard({ source, index }: { source: SourceCitation; index: number }) {
  const Icon = source.area === "population" ? Database : source.area === "sergio-flores" ? BookOpen : FileText;
  return (
    <div
      className="group flex animate-slide-up flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 transition hover:border-indigo-200 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.3)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[12.5px] leading-snug font-semibold text-slate-900">{source.title}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium", AREA_TONE[source.area])}>
              <Icon className="h-2.5 w-2.5" />
              {AREA_LABEL[source.area]}
            </span>
            <span className="text-[10.5px] text-slate-400">{source.reference}</span>
          </div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-3 flex-1 border-l-2 border-slate-200 pl-2.5 text-[12px] leading-relaxed text-slate-500 italic">{source.excerpt}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-500" style={{ width: `${source.relevance}%` }} />
        </div>
        <span className="text-[10.5px] font-medium text-slate-500 tabular-nums">{source.relevance} % de relevancia</span>
      </div>
    </div>
  );
}
