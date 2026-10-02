"use client";

import { AlertCircle, Check, CircleCheck, Clock3, Copy, Info, Loader2, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/components/layout/nav";
import { DISCLAIMER } from "@/lib/mock/labor-ai";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { cn } from "@/lib/format";
import { AnswerContent } from "./AnswerContent";

export function UserMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex animate-slide-up justify-end gap-3">
      <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-slate-900 px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap text-white shadow-sm">{message.content}</div>
      <Avatar name={CURRENT_USER.name} size="sm" className="mt-0.5" />
    </div>
  );
}

export function AssistantMessage({ message, onRetry }: { message: ChatMessageType; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const pending = message.status === "pending";
  const failed = message.status === "error";

  return (
    <div className="flex animate-slide-up gap-3">
      <LogoMark className="mt-0.5 h-8 w-8 shrink-0 shadow-md shadow-indigo-500/20" />
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-semibold text-slate-900">NEXA Laboral AI</span>

        <div className="mt-2 overflow-hidden rounded-2xl rounded-tl-md border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-slate-100 px-5 py-3",
              pending ? "bg-indigo-50/40" : failed ? "bg-amber-50/50" : "bg-slate-50/60",
            )}
          >
            {pending ? (
              <span className="flex items-center gap-2 text-[12px] font-medium text-indigo-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando su consulta…
              </span>
            ) : failed ? (
              <span className="flex items-center gap-2 text-[12px] font-medium text-amber-800">
                <AlertCircle className="h-3.5 w-3.5" />
                Análisis no disponible
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[12px] text-slate-600">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                Respuesta generada por <b className="font-semibold text-slate-800">NEXA Laboral AI</b>
              </span>
            )}
            {!failed && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock3 className="h-3 w-3" />
                Base documental especializada: próxima integración
              </span>
            )}
          </div>

          <div className="px-5 py-5">
            {pending ? (
              <div className="space-y-3" aria-label="Analizando">
                {["w-11/12", "w-full", "w-4/5", "w-2/3"].map((w, i) => (
                  <div key={i} className={cn("h-3 animate-pulse rounded-full bg-slate-100", w)} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            ) : failed ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] leading-relaxed text-slate-700">{message.content}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reintentar
                  </button>
                )}
              </div>
            ) : (
              <AnswerContent markdown={message.content} />
            )}
          </div>

          {message.status === "done" && (
            <div className="flex animate-fade-in flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {DISCLAIMER}
              </div>
              <div className="flex shrink-0 items-center gap-1">
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
