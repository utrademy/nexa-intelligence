"use client";

import { Check, CircleCheck, Copy, Database, Info, Loader2, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/components/layout/nav";
import { DISCLAIMER, THINKING_STEPS } from "@/lib/mock/labor-ai";
import type { AssistantResponse, ChatMessage as ChatMessageType } from "@/lib/types";
import { cn } from "@/lib/format";
import { SourceCitationCard } from "./SourceCitationCard";

export function UserMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex animate-slide-up justify-end gap-3">
      <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-slate-900 px-4 py-3 text-[14px] leading-relaxed text-white shadow-sm">{message.content}</div>
      <Avatar name={CURRENT_USER.name} size="sm" className="mt-0.5" />
    </div>
  );
}

const SECTION_COUNT = 5;

export function AssistantMessage({
  response,
  animate,
  onProgress,
  onDone,
}: {
  response: AssistantResponse;
  animate: boolean;
  onProgress?: () => void;
  onDone?: () => void;
}) {
  const [step, setStep] = useState(animate ? 0 : THINKING_STEPS.length);
  const [chars, setChars] = useState(animate ? 0 : response.analysis.length);
  const [sections, setSections] = useState(animate ? 0 : SECTION_COUNT);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const callbacks = useRef({ onProgress, onDone });

  useEffect(() => {
    callbacks.current = { onProgress, onDone };
  });

  useEffect(() => {
    if (!animate) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let frame = 0;
    THINKING_STEPS.forEach((_, i) => timers.push(setTimeout(() => setStep(i + 1), 650 * (i + 1))));
    const typingStart = 650 * THINKING_STEPS.length + 150;
    timers.push(
      setTimeout(() => {
        const start = performance.now();
        const duration = Math.min(2200, response.analysis.length * 4);
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setChars(Math.round(response.analysis.length * p));
          callbacks.current.onProgress?.();
          if (p < 1) {
            frame = requestAnimationFrame(tick);
          } else {
            for (let s = 1; s <= SECTION_COUNT; s++) {
              timers.push(
                setTimeout(() => {
                  setSections(s);
                  callbacks.current.onProgress?.();
                  if (s === SECTION_COUNT) callbacks.current.onDone?.();
                }, 380 * s),
              );
            }
          }
        };
        frame = requestAnimationFrame(tick);
      }, typingStart),
    );
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [animate, response]);

  const thinking = step < THINKING_STEPS.length;
  const typing = !thinking && chars < response.analysis.length;

  return (
    <div className="flex animate-slide-up gap-3">
      <LogoMark className="mt-0.5 h-8 w-8 shrink-0 shadow-md shadow-indigo-500/20" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">NEXA Laboral AI</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            <ShieldCheck className="h-3 w-3" />
            Basado en conocimiento NEXA
          </span>
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl rounded-tl-md border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          <div className={cn("border-b border-slate-100 px-5 py-3", thinking ? "bg-indigo-50/40" : "bg-slate-50/60")}>
            {thinking ? (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {THINKING_STEPS.map((s, i) => (
                  <span key={s} className={cn("flex items-center gap-1.5 text-[12px] transition", i < step ? "text-slate-500" : i === step ? "font-medium text-indigo-700" : "text-slate-300")}>
                    {i < step ? <Check className="h-3 w-3 text-emerald-500" /> : i === step ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-3 w-3 rounded-full border border-slate-300" />}
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                Análisis basado en <b className="font-semibold text-slate-700">{response.sources.length} fuentes autorizadas</b>
                {response.dataContext && (
                  <>
                    y <b className="font-semibold text-slate-700">datos actuales de la organización</b>
                  </>
                )}
              </div>
            )}
          </div>

          {!thinking && (
            <div className="space-y-6 px-5 py-5">
              <section>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Análisis</h4>
                <p className="text-[14px] leading-[1.7] text-slate-700">
                  {response.analysis.slice(0, chars)}
                  {typing && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-indigo-500" />}
                </p>
              </section>

              {sections >= 1 && response.dataContext && (
                <section className="animate-slide-up">
                  <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                    <Database className="h-3 w-3" />
                    Datos de la organización · Financiera Comultrasan
                  </h4>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {response.dataContext.map((d) => (
                      <div key={d.label} className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5">
                        <div className="text-[11px] text-slate-500">{d.label}</div>
                        <div className="mt-0.5 text-[15px] font-semibold text-slate-900 tabular-nums">{d.value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {sections >= 2 && (
                <section className="animate-slide-up">
                  <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Consideraciones relevantes</h4>
                  <ul className="space-y-2.5">
                    {response.considerations.map((c, i) => (
                      <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-semibold text-indigo-600">{i + 1}</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {sections >= 3 && (
                <section className="animate-slide-up">
                  <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Acciones sugeridas</h4>
                  <div className="space-y-2">
                    {response.actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3.5 py-2.5 text-[13.5px] text-slate-700">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-indigo-300 bg-white">
                          <Check className="h-3 w-3 text-indigo-500" />
                        </span>
                        {a}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {sections >= 4 && (
                <section className="animate-slide-up">
                  <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Fuentes</h4>
                  <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
                    {response.sources.map((s, i) => (
                      <SourceCitationCard key={s.id} source={s} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {sections >= SECTION_COUNT && (
            <div className="flex animate-fade-in flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {DISCLAIMER}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(response.analysis);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Copiar"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <button onClick={() => setFeedback("up")} className={cn("rounded-lg p-1.5 transition hover:bg-white", feedback === "up" ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")} aria-label="Útil">
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button onClick={() => setFeedback("down")} className={cn("rounded-lg p-1.5 transition hover:bg-white", feedback === "down" ? "text-rose-600" : "text-slate-400 hover:text-slate-700")} aria-label="No fue útil">
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
