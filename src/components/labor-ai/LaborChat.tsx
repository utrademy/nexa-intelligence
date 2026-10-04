"use client";

import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Database,
  FileSearch,
  FileText,
  Gavel,
  HardHat,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
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
    knowledgeUsed: data.knowledgeUsed,
    retrievedChunkCount: data.retrievedChunkCount,
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
    <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12.5px] font-medium">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 sm:px-3 py-1 sm:py-1.5 text-emerald-800">
        <Database className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
        Datos organización
      </span>
      <Plus className="h-3 w-3 text-slate-400" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-2.5 sm:px-3 py-1 sm:py-1.5 text-violet-800">
        <Scale className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
        Conocimiento jurídico
      </span>
      <ArrowRight className="h-3 w-3 text-slate-400" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-indigo-600 to-cyan-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-white shadow-md shadow-indigo-500/25">
        <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
        Inteligencia accionable
      </span>
    </div>
  );
}

export function LaborChat({ areas }: { areas: KnowledgeArea[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showConfigMobile, setShowConfigMobile] = useState(false);

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
    let update: Partial<ChatMessage>;
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
        knowledgeUsed: res.knowledgeUsed,
        retrievedChunkCount: res.retrievedChunkCount,
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

  const activeSourcesCount = Array.from(enabledAreas).filter((id) =>
    areas.some((a) => a.id === id && a.documents > 0)
  ).length;

  return (
    <div className="mx-auto flex flex-col gap-5 max-w-[1440px] xl:grid xl:grid-cols-[1fr_320px]">
      {/* MAIN CHAT CONTAINER */}
      <Card className="relative flex h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-8rem)] min-h-[580px] flex-col overflow-hidden shadow-xs border-slate-200/90">
        
        {/* RESPONSIVE HEADER */}
        <div className="flex flex-col border-b border-slate-100 bg-white/95 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-[15px] sm:text-[17px] font-semibold tracking-tight text-slate-900 truncate">
                    NEXA Laboral AI
                  </h2>
                  <span className="rounded-md bg-linear-to-r from-indigo-500 to-cyan-500 px-1.5 py-0.5 text-[9.5px] sm:text-[10px] font-semibold tracking-wide text-white shrink-0">
                    BETA
                  </span>
                </div>
                <p className="hidden sm:block text-[12px] text-slate-500 truncate">
                  Inteligencia especializada en derecho laboral colombiano
                </p>
                <p className="flex items-center gap-1 text-[11px] sm:text-[11.5px] font-medium text-violet-700 truncate">
                  <BookOpen className="h-3 w-3 shrink-0" />
                  <span className="truncate">Con respaldo de {ENDORSEMENT}</span>
                </p>
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* MOBILE TOGGLE FOR SOURCES & CONTEXT */}
              <button
                type="button"
                onClick={() => setShowConfigMobile((v) => !v)}
                className="flex xl:hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-600 transition hover:bg-slate-100"
                title="Configurar fuentes RAG"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden xs:inline">Fuentes</span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                  {activeSourcesCount}
                </span>
              </button>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    requestRef.current?.abort();
                    requestRef.current = null;
                    setMessages([]);
                    setBusy(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-[11.5px] sm:text-[12.5px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Nueva conversación</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              )}
            </div>
          </div>

          {/* MOBILE COLLAPSIBLE CONFIG PANEL */}
          {showConfigMobile && (
            <div className="mt-3 pt-3 border-t border-slate-100 xl:hidden animate-fade-in space-y-3 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Fuentes RAG disponibles
                </span>
                <span className="text-[11px] text-slate-500">
                  {activeSourcesCount} de {areas.filter((a) => a.documents > 0).length} activas
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {areas.map((a) => {
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
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-2 text-left text-[11px] transition",
                        !hasDocs
                          ? "opacity-40 border-dashed border-slate-200 bg-slate-50"
                          : on
                          ? "border-indigo-200 bg-indigo-50/70 text-indigo-950 font-medium"
                          : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      <span className="truncate pr-1">{a.name}</span>
                      <span className={cn("h-2 w-2 rounded-full shrink-0", on ? "bg-indigo-600" : "bg-slate-300")} />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1 text-[11.5px]">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-emerald-600" />
                  Datos de Financiera Comultrasan
                </span>
                <button
                  type="button"
                  onClick={() => setUseOrgData((v) => !v)}
                  className={cn("px-2 py-0.5 rounded text-[10.5px] font-semibold transition", useOrgData ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}
                >
                  {useOrgData ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHAT MESSAGES BODY */}
        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
              <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
              <div className="pointer-events-none absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl" />
              
              <div className="relative flex w-full max-w-2xl animate-slide-up flex-col items-center text-center">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                
                <h3 className="mt-4 text-[19px] sm:text-[23px] leading-snug font-semibold tracking-tight text-slate-900">
                  Asistente Virtual Jurídico Laboral
                </h3>
                <p className="mt-1 text-[13px] font-medium text-indigo-600">
                  Potenciado con IA generativa, contexto de base de datos y doctrina de Sergio Flórez Abogados
                </p>
                <p className="mt-2.5 max-w-lg text-[13px] sm:text-[13.5px] leading-relaxed text-slate-500">
                  Escriba cualquier consulta sobre derecho laboral colombiano, estabilidad laboral reforzada, contratación, o seguridad social para recibir un análisis estructurado al instante.
                </p>

                <KnowledgeEquation />

                <div className="mt-6 sm:mt-8 w-full">
                  <div className="flex items-center justify-center gap-1.5 text-[12.5px] sm:text-[13px] font-semibold text-slate-800 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Preguntas sugeridas para iniciar la conversación:
                  </div>

                  <div className="grid w-full gap-2 text-left sm:grid-cols-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => {
                      const Icon = SUGGESTION_ICONS[i % SUGGESTION_ICONS.length];
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => ask(q)}
                          className="group flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white/95 p-3 sm:p-3.5 shadow-2xs backdrop-blur transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm active:scale-[0.99]"
                        >
                          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </span>
                          <span className="text-[12px] sm:text-[12.5px] leading-relaxed font-medium text-slate-700 group-hover:text-slate-900">
                            {q}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 px-3.5 py-5 sm:px-6 sm:py-7">
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

        {/* INPUT COMPOSER DEDICATED CHAT BAR */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-sm px-3.5 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4">
          {messages.length > 0 && !busy && (
            <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="shrink-0 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1 text-[11.5px] text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {q.length > 55 ? `${q.slice(0, 55)}…` : q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10"
          >
            <div className="relative">
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
                placeholder="Escriba su consulta jurídica aquí (ej. ¿Qué requisitos aplican para estabilidad laboral reforzada?)..."
                className="block w-full resize-none rounded-2xl bg-transparent px-3.5 pt-3 pb-1 text-[13.5px] sm:text-[14px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-slate-50">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 sm:px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-indigo-700">
                  <BookOpen className="h-3 w-3 text-indigo-600 shrink-0" />
                  <span>RAG: {activeSourcesCount} fuentes activas</span>
                </span>
                {useOrgData && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                    <Database className="h-3 w-3 text-emerald-600" />
                    Datos org
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Presione Enter ↵ para enviar
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
                  aria-label="Enviar mensaje"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </Card>

      {/* DESKTOP SIDEBAR WITH SOURCES & ORG CONTEXT */}
      <div className="hidden xl:block space-y-6">
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
