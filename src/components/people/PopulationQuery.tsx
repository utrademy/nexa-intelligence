"use client";

import { ArrowUp, Database, HelpCircle, MapPin, Megaphone, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { answerPopulationQuestion, type PopulationAnswer } from "@/lib/population-query";
import type { Person } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const SUGGESTIONS = [
  "¿Cuántos asociados entre 25 y 45 años tienen información laboral incompleta?",
  "¿Cuántas personas están sin datos de discapacidad o inclusión?",
  "¿Cuál es el porcentaje de asociados contactables por municipio?",
  "¿Cuántos asociados tienen vacíos críticos en ingresos o empleo?",
];

export function PopulationQuery({ people, total, cities }: { people: Person[]; total: number; cities: readonly string[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<PopulationAnswer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setQuestion(q);
    setAsked(q);
    setLoading(true);
    setAnswer(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAnswer(answerPopulationQuestion(q, people, total, cities));
      setLoading(false);
    }, 850);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-linear-to-r from-indigo-50/90 via-white to-cyan-50/80 p-4.5 sm:p-5 shadow-xs">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
          
          {/* HEADER & CLEAR VALUE PROPOSITION */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] sm:text-[16px] font-semibold tracking-tight text-slate-900">
                    Consulta Inteligente de Población con IA
                  </h3>
                  <span className="rounded-md bg-linear-to-r from-indigo-600 to-cyan-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                    IA Activa
                  </span>
                </div>
                <p className="text-[12px] sm:text-[12.5px] text-slate-500">
                  Formule cualquier pregunta en lenguaje natural sobre los <strong className="font-semibold text-slate-700">{formatNumber(total)} perfiles</strong> en base de datos.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              PostgreSQL · Respuesta en tiempo real
            </div>
          </div>

          {/* SEARCH INPUT BAR */}
          <form
            className="relative mt-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 flex items-center text-indigo-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pregunte a la IA sobre la población (ej: ¿Cuántos asociados de Bucaramanga tienen empleo independiente?)..."
                className="h-12 w-full rounded-xl border border-indigo-200/90 bg-white pr-28 pl-10 text-[13.5px] sm:text-[14px] text-slate-800 shadow-[0_2px_8px_rgba(99,102,241,0.06)] placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 focus:outline-none"
              />
              <div className="absolute right-1.5 flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[12.5px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <span className="hidden sm:inline">Consultar</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* SUGGESTION CHIPS */}
          {!answer && !loading && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-semibold text-slate-600 flex items-center gap-1 shrink-0">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-500" />
                Consultas frecuentes:
              </span>
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => ask(sug)}
                  className="rounded-lg border border-indigo-100 bg-white/90 px-2.5 py-1 text-[11.5px] font-medium text-indigo-700 shadow-2xs backdrop-blur transition hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-900 active:scale-[0.99]"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="mt-3 flex items-center gap-2.5 text-[12.5px] font-medium text-indigo-700">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <span>Analizando registros y dimensiones poblacionales en Supabase PostgreSQL…</span>
            </div>
          )}
        </div>

        {/* ANSWER CARD */}
        {answer && (
          <div className="w-full animate-scale-in rounded-2xl border border-indigo-200/90 bg-white p-4.5 shadow-[0_10px_28px_-10px_rgba(99,102,241,0.22)] lg:w-[420px] shrink-0">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="line-clamp-1 text-[11.5px] font-medium text-slate-500">
                “{asked}”
              </span>
              <button
                type="button"
                onClick={() => setAnswer(null)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>
            
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[32px] leading-none font-bold tracking-tight text-indigo-700 tabular-nums">
                {formatNumber(answer.count)}
              </span>
              <span className="text-[13px] font-semibold text-slate-700">asociados</span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {Math.round((answer.count / total) * 100)} % de la base
              </span>
            </div>

            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              <strong className="font-semibold text-slate-900">{answer.groupLabel}</strong> con {answer.topicLabel}. {answer.summary}
            </p>

            {answer.topCity && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>
                  Concentración geográfica mayor: <strong className="font-semibold text-slate-800">{answer.topCity.name}</strong> ({answer.topCity.share} %)
                </span>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">Datos reales POC</span>
              <Button size="sm" variant="ai" onClick={() => router.push(`/campaigns?create=1&audience=${answer.count}`)}>
                <Megaphone className="h-3.5 w-3.5" />
                Iniciar campaña con IA
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
