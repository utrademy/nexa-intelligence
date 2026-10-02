import { cn } from "@/lib/format";

type Tone = "emerald" | "amber" | "rose" | "indigo" | "violet" | "slate" | "cyan" | "sky";

const TONES: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
};

const DOTS: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
};

const STATUS_TONES: Record<string, Tone> = {
  Completo: "emerald",
  Completado: "emerald",
  Completada: "emerald",
  Finalizada: "emerald",
  Indexado: "emerald",
  Verificado: "emerald",
  Activa: "emerald",
  Reportada: "emerald",
  Otorgada: "emerald",
  "Información actualizada": "violet",
  "Actualizado por IA": "violet",
  Parcial: "amber",
  Procesando: "indigo",
  "En progreso": "indigo",
  Programada: "sky",
  Contactado: "sky",
  Respondió: "cyan",
  Pendiente: "amber",
  "Requiere revisión": "amber",
  "Vacíos críticos": "rose",
  Faltante: "rose",
  "No desea participar": "rose",
  Vencido: "rose",
  "Sin respuesta": "slate",
  "Sin contactar": "slate",
  Borrador: "slate",
  "En pausa": "slate",
};

const LIVE_STATUSES = new Set(["Procesando", "En progreso", "Activa"]);

export function StatusBadge({
  status,
  tone,
  dot = true,
  className,
}: {
  status: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  const t = tone ?? STATUS_TONES[status] ?? "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset",
        TONES[t],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {LIVE_STATUSES.has(status) && (
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", DOTS[t])} />
          )}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", DOTS[t])} />
        </span>
      )}
      {status}
    </span>
  );
}
