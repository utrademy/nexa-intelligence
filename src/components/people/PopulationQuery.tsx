"use client";

import { ArrowUp, MapPin, Megaphone, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { answerPopulationQuestion, type PopulationAnswer } from "@/lib/population-query";
import type { Person } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const EXAMPLE = "¿Cuántos asociados entre 25 y 45 años tienen información laboral incompleta?";

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
    }, 900);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-linear-to-br from-indigo-50/80 via-white to-cyan-50/50 p-5">
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-cyan-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[14.5px] font-semibold tracking-tight text-slate-900">Pregunte sobre esta población</h3>
            <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
              IA
            </span>
          </div>
          <form
            className="relative mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ej: ${EXAMPLE}`}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-4 text-[13.5px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              aria-label="Consultar"
              className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
          {!answer && !loading && (
            <button onClick={() => ask(EXAMPLE)} className="mt-2.5 text-left text-[12.5px] text-slate-500 transition hover:text-indigo-600">
              Probar con: <span className="font-medium text-indigo-600">{EXAMPLE}</span>
            </button>
          )}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-indigo-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              Analizando la población…
            </div>
          )}
        </div>

        {answer && (
          <div className="w-full animate-scale-in rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.25)] lg:w-[420px]">
            <div className="line-clamp-1 text-[11.5px] text-slate-400">“{asked}”</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[28px] leading-none font-semibold tracking-tight text-indigo-700 tabular-nums">{formatNumber(answer.count)}</span>
              <span className="pb-0.5 text-[12.5px] text-slate-500">asociados</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
              <span className="font-medium text-slate-800">{answer.groupLabel}</span> con {answer.topicLabel}. {answer.summary}
            </p>
            {answer.topCity && (
              <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Mayor concentración: <span className="font-medium text-slate-700">{answer.topCity.name}</span> ({answer.topCity.share} %)
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-400">Estimación sobre datos de demostración</span>
              <Button size="sm" variant="ai" onClick={() => router.push(`/campaigns?create=1&audience=${answer.count}`)}>
                <Megaphone className="h-3.5 w-3.5" />
                Crear campaña con IA
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
