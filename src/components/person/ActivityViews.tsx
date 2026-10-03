import { FileCheck2, FileClock, FileWarning, FileX2, Upload } from "lucide-react";
import { ChannelIcon } from "@/components/ui/ChannelBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PersonDocument, PersonInteraction } from "@/lib/types";
import { cn, formatDate } from "@/lib/format";

export function InteractionsTimeline({ interactions }: { interactions: PersonInteraction[] }) {
  return (
    <ol className="relative space-y-1">
      {interactions.map((it, i) => (
        <li key={it.id} className={cn("relative flex gap-4 rounded-xl p-3 transition", it.outcome === "Información actualizada" && "animate-highlight")}>
          {i < interactions.length - 1 && <span className="absolute top-12 bottom-[-8px] left-[26px] w-px bg-slate-200" />}
          <ChannelIcon channel={it.channel} className="relative h-7 w-7" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[13.5px] font-semibold text-slate-900">{it.title}</div>
              <StatusBadge status={it.outcome} />
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{it.description}</p>
            {it.fieldsUpdated && it.fieldsUpdated.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {it.fieldsUpdated.map((field) => (
                  <span key={field} className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200/60">
                    + {field}
                  </span>
                ))}
              </div>
            )}
            {it.transcriptSnippet && (
              <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11.5px] text-slate-600 italic border border-slate-200/60">
                “{it.transcriptSnippet}”
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-3 text-[12px] text-slate-400">
              <span>{formatDate(it.date)}</span>
              {it.consentStatus && (
                <span className={cn("font-medium", it.consentStatus === "Otorgada" ? "text-emerald-600" : "text-amber-600")}>
                  Consentimiento: {it.consentStatus}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const DOC_ICON = {
  Verificado: { icon: FileCheck2, tone: "text-emerald-600 bg-emerald-50" },
  Pendiente: { icon: FileClock, tone: "text-amber-600 bg-amber-50" },
  Vencido: { icon: FileWarning, tone: "text-rose-600 bg-rose-50" },
  Faltante: { icon: FileX2, tone: "text-slate-400 bg-slate-100" },
};

export function DocumentsList({ documents }: { documents: PersonDocument[] }) {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80">
      {documents.map((d) => {
        const cfg = DOC_ICON[d.status];
        return (
          <div key={d.id} className="flex items-center gap-4 bg-white px-4 py-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", cfg.tone)}>
              <cfg.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-slate-900">{d.name}</div>
              <div className="text-[12px] text-slate-400">
                {d.type}
                {d.updatedAt && ` · Actualizado el ${formatDate(d.updatedAt)}`}
              </div>
            </div>
            <StatusBadge status={d.status} />
            {(d.status === "Faltante" || d.status === "Vencido") && (
              <button className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex">
                <Upload className="h-3 w-3" />
                Solicitar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
