"use client";

import {
  AlertCircle,
  BookOpen,
  Check,
  CircleCheck,
  Copy,
  Database,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/components/layout/nav";
import { DISCLAIMER } from "@/lib/mock/labor-ai";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { cn } from "@/lib/format";
import { AnswerContent } from "./AnswerContent";
import { SourceCitationCard } from "./SourceCitationCard";

export function UserMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex animate-slide-up justify-end gap-2.5 sm:gap-3">
      <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-2.5 sm:py-3 text-[13.5px] sm:text-[14px] leading-relaxed whitespace-pre-wrap text-white shadow-sm">
        {message.content}
      </div>
      <Avatar name={CURRENT_USER.name} size="sm" className="mt-0.5 shrink-0" />
    </div>
  );
}

export function AssistantMessage({ message, onRetry }: { message: ChatMessageType; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const pending = message.status === "pending";
  const failed = message.status === "error";
  const isCombined = message.mode === "COMBINED" || (Boolean(message.dataUsed) && (message.sources?.length ?? 0) > 0);

  return (
    <div className="flex animate-slide-up gap-2.5 sm:gap-3">
      <div className="mt-0.5 shrink-0">
        <LogoMark className="h-7 w-7 sm:h-8 sm:w-8 shadow-md shadow-indigo-500/20" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] sm:text-[13px] font-semibold text-slate-900">NEXA Laboral AI</span>
          <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
            Asistente Jurídico
          </span>
        </div>

        <div className="mt-1.5 overflow-hidden rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          {/* Header pill indicator */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-slate-100 px-3.5 py-2.5 sm:px-5 sm:py-3",
              pending ? "bg-indigo-50/40" : failed ? "bg-amber-50/50" : isCombined ? "bg-gradient-to-r from-indigo-50/70 via-violet-50/40 to-slate-50/60" : "bg-slate-50/60",
            )}
          >
            {pending ? (
              <span className="flex items-center gap-2 text-[11.5px] sm:text-[12px] font-medium text-indigo-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando su consulta jurídica…
              </span>
            ) : failed ? (
              <span className="flex items-center gap-2 text-[11.5px] sm:text-[12px] font-medium text-amber-800">
                <AlertCircle className="h-3.5 w-3.5" />
                Análisis no disponible
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-slate-600">
                  <CircleCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Respuesta verificada</span>
                </span>
                {isCombined ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/90 bg-indigo-50/90 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-semibold text-indigo-900 shadow-xs">
                      <Sparkles className="h-3 w-3 text-indigo-600" />
                      Datos + Conocimiento Sergio Flórez
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-800 shadow-xs">
                      <Database className="h-2.5 w-2.5 text-emerald-600" />
                      {Number(message.sampleSize || 10000).toLocaleString("es-CO")} perfiles
                    </span>
                  </>
                ) : (
                  <>
                    {message.dataUsed && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-800 shadow-xs">
                        <Database className="h-2.5 w-2.5 text-emerald-600" />
                        Datos organizacionales ({Number(message.sampleSize || 10000).toLocaleString("es-CO")})
                      </span>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200/80 bg-violet-50 px-2 py-0.5 text-[10.5px] font-medium text-violet-800 shadow-xs">
                        <BookOpen className="h-2.5 w-2.5 text-violet-600" />
                        RAG Sergio Flórez Abogados ({message.sources.length} fuente{message.sources.length === 1 ? "" : "s"})
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            {!failed && (
              <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-indigo-500" />
                Motor RAG
              </span>
            )}
          </div>

          <div className="px-3.5 py-4 sm:px-5 sm:py-5">
            {pending ? (
              <div className="space-y-3" aria-label="Analizando">
                {["w-11/12", "w-full", "w-4/5", "w-2/3"].map((w, i) => (
                  <div key={i} className={cn("h-3 animate-pulse rounded-full bg-slate-100", w)} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            ) : failed ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-slate-700">{message.content}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reintentar
                  </button>
                )}
              </div>
            ) : (
              <div>
                <AnswerContent markdown={message.content} />
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                        FUENTES CONSULTADAS · SERGIO FLÓREZ &amp; ABOGADOS
                      </span>
                      <span className="text-[11px] font-medium text-violet-600">
                        Recuperación semántica
                      </span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {message.sources.map((source, idx) => (
                        <SourceCitationCard key={source.id || idx} source={source} index={idx} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {message.status === "done" && (
            <div className="flex animate-fade-in flex-col gap-2.5 border-t border-slate-100 bg-slate-50/50 px-3.5 py-2.5 sm:px-5 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Análisis con valor consultivo respaldado en jurisprudencia y normativa laboral.</span>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(message.content);
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
