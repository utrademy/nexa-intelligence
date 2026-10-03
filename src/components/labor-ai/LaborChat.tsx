"use client";

import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Building2,
  ClipboardList,
  Clock3,
  Database,
  FileSearch,
  FileText,
  Gavel,
  HardHat,
  Paperclip,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Card } from "@/components/ui/Card";
import { DISCLAIMER, SUGGESTED_QUESTIONS } from "@/lib/mock/labor-ai";
import { ENDORSEMENT } from "@/lib/mock/knowledge";
import type { ChatMessage, KnowledgeArea, KnowledgeAreaId, LaborAiResponse, LaborAiTurn } from "@/lib/types";
import { cn } from "@/lib/format";
import { AssistantMessage, UserMessage } from "./ChatMessage";

const ERROR_MESSAGE = "No fue posible generar el análisis en este momento. Inténtelo nuevamente.";

function toHistory(messages: ChatMessage[]): LaborAiTurn[] {
  const turns: LaborAiTurn[] = [];
  for (let i = 0; i + 1 < messages.length; i += 2) {
    const [q, a] = [messages[i], messages[i + 1]];
    if (q.role === "user" && a.role === "assistant" && a.status === "done") {
      turns.push({ role: "user", content: q.content }, { role: "assistant", content: a.content });
    }
  }
  return turns;
}

async function requestAnswer(
  question: string,
  history: LaborAiTurn[],
  includeOrgContext: boolean,
  knowledgeAreas: KnowledgeAreaId[],
  signal: AbortSignal
) {
  const res = await fetch("/api/labor-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history, includeOrgContext, knowledgeAreas }),
    signal,
  });
  const data = (await res.json().catch(() => null)) as LaborAiResponse | null;
  if (!res.ok || !data || !("answer" in data) || !data.answer) throw new Error("labor-ai request failed");
  return {
    answer: data.answer,
    dataUsed: data.dataUsed,
    sampleSize: data.sampleSize,
    sources: data.sources,
    mode: data.mode,
  };
}

const SUGGESTION_ICONS = [Gavel, Users, FileSearch, ClipboardList];
const AREA_ICONS: Record<KnowledgeAreaId, typeof Scale> = {
  "labor-law": Scale,
  "social-security": ShieldCheck,
  osh: HardHat,
  "sergio-flores": BookOpen,
  other: FileText,
};

function KnowledgeEquation() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[12.5px] font-medium">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-emerald-800">
        <Database className="h-3.5 w-3.5" />
        Datos de su organización
      </span>
      <Plus className="h-3.5 w-3.5 text-slate-400" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-violet-800">
        <Scale className="h-3.5 w-3.5" />
        Conocimiento laboral especializado
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-indigo-600 to-cyan-600 px-3 py-1.5 text-white shadow-md shadow-indigo-500/25">
        <Sparkles className="h-3.5 w-3.5" />
        Inteligencia accionable
      </span>
    </div>
  );
}

export function LaborChat({ areas }: { areas: KnowledgeArea[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Default to enabled and ON ONLY for areas that actually have at least 1 indexed document
  const [enabledAreas, setEnabledAreas] = useState<Set<KnowledgeAreaId>>(() => {
    return new Set(areas.filter((a) => a.documents > 0).map((a) => a.id));
  });
  const [useOrgData, setUseOrgData] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => () => requestRef.current?.abort(), []);

  const send = async (question: string, base: ChatMessage[]) => {
    const q = question.trim();
    if (!q || busy) return;
    const now = new Date().toISOString();
    const seq = ++seqRef.current;
    const assistantId = `a-${seq}`;
    setMessages([
      ...base,
      { id: `u-${seq}`, role: "user", content: q, createdAt: now },
      { id: assistantId, role: "assistant", content: "", status: "pending", createdAt: now },
    ]);
    setInput("");
    setBusy(true);
    requestAnimationFrame(scrollToBottom);

    const controller = new AbortController();
    requestRef.current = controller;
    let update: Pick<ChatMessage, "content" | "status" | "dataUsed" | "sampleSize" | "sources" | "mode">;
    try {
      const activeAreas = Array.from(enabledAreas).filter((id) =>
        areas.some((a) => a.id === id && a.documents > 0)
      );
      const res = await requestAnswer(q, toHistory(base), useOrgData, activeAreas, controller.signal);
      update = {
        content: res.answer,
        dataUsed: res.dataUsed,
        sampleSize: res.sampleSize,
        sources: res.sources,
        mode: res.mode,
        status: "done",
      };
    } catch {
      if (controller.signal.aborted) return;
      update = { content: ERROR_MESSAGE, status: "error" };
    }
    if (requestRef.current !== controller) return;
    requestRef.current = null;
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...update } : m)));
    setBusy(false);
    requestAnimationFrame(scrollToBottom);
  };

  const ask = (question: string) => send(question, messages);

  const retry = (assistantId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantId);
    if (idx < 1) return;
    send(messages[idx - 1].content, messages.slice(0, idx - 1));
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[1fr_320px]">
      <Card className="relative flex h-[calc(100vh-8rem)] min-h-[620px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <LogoMark className="h-10 w-10" />
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900">
                NEXA Laboral AI
                <span className="rounded-md bg-linear-to-r from-indigo-500 to-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">BETA</span>
              </h2>
              <p className="text-[12.5px] text-slate-500">Inteligencia especializada en derecho laboral colombiano</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-violet-700">
                <BookOpen className="h-3 w-3" />
                Con conocimiento especializado de {ENDORSEMENT}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                requestRef.current?.abort();
                requestRef.current = null;
                setMessages([]);
                setBusy(false);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] whitespace-nowrap font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Nueva conversación
            </button>
          )}
        </div>

        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-7">
              <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
              <div className="pointer-events-none absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl" />
              <div className="relative flex max-w-3xl animate-slide-up flex-col items-center text-center">
                <LogoMark className="h-12 w-12 shadow-xl shadow-indigo-500/30" />
                <h3 className="mt-4 max-w-2xl text-[22px] leading-snug font-semibold tracking-tight text-slate-900">
                  Su información organizacional y el conocimiento laboral especializado, <span className="text-gradient-ai">en un solo lugar.</span>
                </h3>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-500">
                  Consulte temas de derecho laboral colombiano, seguridad social, inclusión laboral y seguridad y salud en el trabajo. NEXA puede combinar
                  conocimiento jurídico autorizado con el contexto y los datos disponibles de su organización.
                </p>
                <KnowledgeEquation />

                <div className="mt-7 text-[15px] font-semibold text-slate-900">¿Qué necesita analizar hoy?</div>
                <div className="mt-3 grid w-full gap-2.5 md:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => {
                    const Icon = SUGGESTION_ICONS[i % SUGGESTION_ICONS.length];
                    return (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_12px_32px_-12px_rgba(99,102,241,0.35)]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[13px] leading-relaxed text-slate-700">{q}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
              {messages.map((m) =>
                m.role === "user" ? (
                  <UserMessage key={m.id} message={m} />
                ) : (
                  <AssistantMessage key={m.id} message={m} onRetry={busy ? undefined : () => retry(m.id)} />
                ),
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-6 pt-4 pb-4">
          {messages.length > 0 && !busy && (
            <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {q.length > 64 ? `${q.slice(0, 64)}…` : q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={2}
              placeholder="Consulte sobre derecho laboral, seguridad social, inclusión o cumplimiento…"
              className="block w-full resize-none rounded-2xl bg-transparent px-4 pt-3 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Adjuntar">
                  <Paperclip className="h-4 w-4" />
                </button>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  <BookOpen className="h-3 w-3 text-indigo-500" />
                  RAG: {Array.from(enabledAreas).filter((id) => areas.some((a) => a.id === id && a.documents > 0)).length} de {areas.filter((a) => a.documents > 0).length} fuentes activas
                </span>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || busy}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400"
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Fuentes de conocimiento
          </div>
          <p className="mt-1 text-[12px] text-slate-500">
            Selecciona las fuentes que NEXA puede consultar para responder.
          </p>
          <div className="mt-4 space-y-2">
            {areas.map((a) => {
              const Icon = AREA_ICONS[a.id] || Scale;
              const hasDocs = a.documents > 0;
              const on = hasDocs && enabledAreas.has(a.id);

              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!hasDocs}
                  onClick={() => {
                    if (!hasDocs) return;
                    setEnabledAreas((prev) => {
                      const next = new Set(prev);
                      if (next.has(a.id)) next.delete(a.id);
                      else next.add(a.id);
                      return next;
                    });
                  }}
                  aria-pressed={on}
                  aria-disabled={!hasDocs}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                    !hasDocs
                      ? "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/50 opacity-55"
                      : on
                      ? "border-slate-200 bg-white hover:border-indigo-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                      : "border-slate-200 bg-slate-50/70 opacity-70 hover:opacity-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      !hasDocs
                        ? "bg-slate-100 text-slate-400"
                        : !on
                        ? "bg-slate-100 text-slate-400"
                        : a.id === "sergio-flores"
                        ? "bg-violet-50 text-violet-600"
                        : "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[13px] leading-snug font-medium",
                        hasDocs ? "text-slate-800" : "text-slate-500"
                      )}
                    >
                      {a.name}
                    </span>
                    <span className="block text-[11.5px] text-slate-400">
                      {a.documents} {a.documents === 1 ? "documento" : "documentos"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      !hasDocs ? "bg-slate-200" : on ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                        on ? "left-[18px]" : "left-0.5"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
              <Database className="h-4 w-4 text-emerald-500" />
              Contexto de la organización
            </div>
            <button
              onClick={() => setUseOrgData((v) => !v)}
              className={cn("relative h-5 w-9 rounded-full transition", useOrgData ? "bg-emerald-500" : "bg-slate-300")}
              aria-label="Activar o desactivar datos de la organización"
            >
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", useOrgData ? "left-[18px]" : "left-0.5")} />
            </button>
          </div>
          <div className={cn("mt-4 space-y-3 transition", !useOrgData && "opacity-40")}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-white p-1 shadow-xs">
                <Image
                  src="/brand/comultrasan-logo.png"
                  alt="Financiera Comultrasan"
                  width={48}
                  height={24}
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <div className="text-[13px] font-medium text-slate-800">Financiera Comultrasan</div>
                <div className="text-[11.5px] text-slate-400">Institución financiera cooperativa · 480 empleados</div>
              </div>
            </div>
            {[
              { label: "Perfiles en base de datos", value: "10.000" },
              { label: "Completitud promedio", value: "85,5 %" },
              { label: "Perfiles contactables", value: "95,6 %" },
              { label: "Vacíos críticos de información", value: "543" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-semibold text-slate-800 tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 text-[12px] leading-relaxed text-amber-900">{DISCLAIMER}</div>
      </div>
    </div>
  );
}
