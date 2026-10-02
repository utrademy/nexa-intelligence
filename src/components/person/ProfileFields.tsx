import { CircleCheck, CircleDashed, ShieldCheck, Sparkles } from "lucide-react";
import type { ProfileField } from "@/lib/types";
import { cn, formatDate, formatDateTime } from "@/lib/format";

export function KnownField({ field }: { field: ProfileField }) {
  if (field.aiCollected) {
    return (
      <div className="relative animate-highlight rounded-xl border border-violet-200 bg-linear-to-br from-violet-50/70 via-white to-cyan-50/40 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[12px] font-medium text-slate-500">{field.label}</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Sparkles className="h-2.5 w-2.5" />
            IA
          </span>
        </div>
        <div className="mt-1 text-[14px] font-semibold text-slate-900">{field.value}</div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-violet-100 pt-2 text-[11px]">
          <span className="text-slate-400">
            Fuente <span className="font-medium text-violet-700">{field.source}</span>
          </span>
          <span className="text-slate-400">
            Confianza <span className="font-medium text-slate-700">{Math.round((field.confidence ?? 0) * 100)} %</span>
          </span>
          <span className="text-slate-400">{field.updatedAt && formatDateTime(field.updatedAt)}</span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Autorización {field.consent?.toLowerCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-medium text-slate-500">{field.label}</div>
        <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
      </div>
      <div className="mt-1 text-[14px] font-semibold text-slate-900">{field.value}</div>
      <div className="mt-1.5 text-[11px] text-slate-400">
        {field.source} {field.updatedAt && `· ${formatDate(field.updatedAt)}`}
      </div>
    </div>
  );
}

export function MissingField({ field }: { field: ProfileField }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-medium text-slate-500">{field.label}</div>
        {field.critical ? (
          <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-600/10">Crítico</span>
        ) : (
          <CircleDashed className="h-3.5 w-3.5 text-slate-300" />
        )}
      </div>
      <div className="mt-1 text-[14px] font-medium text-slate-400 italic">Sin información</div>
      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-500">
        <Sparkles className="h-3 w-3" />
        Recopilable con IA
      </div>
    </div>
  );
}

export function FieldGroups({ fields }: { fields: ProfileField[] }) {
  const known = fields.filter((f) => f.known);
  const missing = fields.filter((f) => !f.known);
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[13px] font-semibold text-slate-900">Información disponible</span>
          <span className="text-[12px] text-slate-400">{known.length} campos</span>
        </div>
        {known.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {known.map((f) => (
              <KnownField key={f.key} field={f} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-slate-400">Aún no hay información disponible.</p>
        )}
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", missing.length ? "bg-rose-500" : "bg-slate-300")} />
          <span className="text-[13px] font-semibold text-slate-900">Información pendiente</span>
          <span className="text-[12px] text-slate-400">{missing.length} campos</span>
        </div>
        {missing.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {missing.map((f) => (
              <MissingField key={f.key} field={f} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-4 py-3 text-[13px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            <CircleCheck className="h-4 w-4" />
            Esta dimensión está completamente caracterizada.
          </div>
        )}
      </div>
    </div>
  );
}
