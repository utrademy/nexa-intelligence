"use client";

import { Bot, Check, FileText, Loader2, MessageCircle, MessageSquareText, PhoneCall, RotateCcw, ShieldCheck, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CHANNEL_SOURCE } from "@/lib/characterization";
import type { Channel } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/format";

const STAGES = [
  "Preparando la caracterización con IA…",
  "Contactando al asociado…",
  "Conversación en curso…",
  "Información recibida…",
  "Perfil actualizado.",
];

const STAGE_DURATIONS = [1300, 1500, 4200, 1500];

const CHANNELS: { id: Channel; label: string; hint: string; icon: typeof PhoneCall; tone: string }[] = [
  { id: "voice", label: "Llamada con IA", hint: "Agente de voz en lenguaje natural", icon: PhoneCall, tone: "text-violet-600 bg-violet-50 group-hover:bg-violet-100" },
  { id: "whatsapp", label: "WhatsApp", hint: "Conversación por chat", icon: MessageCircle, tone: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100" },
  { id: "sms", label: "SMS", hint: "Preguntas breves por mensaje de texto", icon: MessageSquareText, tone: "text-amber-600 bg-amber-50 group-hover:bg-amber-100" },
  { id: "form", label: "Formulario seguro", hint: "Formulario cifrado con verificación OTP", icon: FileText, tone: "text-sky-600 bg-sky-50 group-hover:bg-sky-100" },
];

const CHANNEL_ICON: Record<Channel, { icon: typeof PhoneCall; tone: string }> = {
  voice: { icon: PhoneCall, tone: "text-violet-600" },
  whatsapp: { icon: MessageCircle, tone: "text-emerald-600" },
  sms: { icon: MessageSquareText, tone: "text-amber-600" },
  form: { icon: FileText, tone: "text-sky-600" },
};

function transcript(firstName: string, channel: Channel) {
  if (channel === "form") {
    return [
      { from: "ai", text: `Enlace enviado: “Hola, ${firstName}. Actualice sus datos de forma segura en comultrasan.nexa.co/f/8KQ2”` },
      { from: "member", text: "Formulario seguro abierto · identidad verificada con código OTP" },
      { from: "member", text: "Autorización de tratamiento de datos aceptada (Ley 1581 de 2012)" },
      { from: "member", text: "Sección de hogar completada · 3 campos" },
      { from: "member", text: "Sección laboral y de ingresos completada · 3 campos" },
      { from: "member", text: "Inclusión y preferencias completadas · 4 campos" },
    ];
  }
  if (channel === "sms") {
    return [
      { from: "ai", text: `Financiera Comultrasan: Hola, ${firstName}. ¿Nos autoriza a actualizar sus datos según la Ley 1581 de 2012? Responda SÍ o NO.` },
      { from: "member", text: "SÍ" },
      { from: "ai", text: "Gracias. ¿Cuántas personas conforman su hogar?" },
      { from: "member", text: "4" },
      { from: "ai", text: "¿Cuál es su ocupación principal?" },
      { from: "member", text: "Tengo una panadería" },
    ];
  }
  return [
    { from: "ai", text: `Buenos días, ${firstName}. Le habla NEXA, el asistente virtual de Financiera Comultrasan. ¿Tiene un momento para actualizar su información?` },
    { from: "member", text: "Sí, claro." },
    { from: "ai", text: "Antes de comenzar, ¿autoriza el tratamiento de sus datos personales de acuerdo con nuestra política y la Ley 1581 de 2012?" },
    { from: "member", text: "Sí, autorizo." },
    { from: "ai", text: "Muchas gracias. ¿Cuántas personas conforman su hogar y cuántas dependen económicamente de usted?" },
    { from: "member", text: "Somos cuatro en la casa y dos dependen de mí." },
    { from: "ai", text: "¿Cuál es actualmente su ocupación principal y en qué rango se encuentran sus ingresos mensuales?" },
    { from: "member", text: "Tengo una panadería hace seis años; gano entre tres y cinco salarios mínimos." },
  ];
}

export function AiCharacterizationCard({
  firstName,
  score,
  missing,
  onComplete,
}: {
  firstName: string;
  score: number;
  missing: number;
  onComplete: (channel: Channel, timestamp: string) => number;
}) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [stage, setStage] = useState(-1);
  const [lines, setLines] = useState(0);
  const [result, setResult] = useState<{ filled: number; timestamp: string } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const running = stage >= 0 && stage < STAGES.length - 1;

  const start = (c: Channel) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setChannel(c);
    setStage(0);
    setLines(0);
    setResult(null);

    const script = transcript(firstName, c);
    let t = 0;
    STAGE_DURATIONS.forEach((d, i) => {
      t += d;
      timers.current.push(setTimeout(() => setStage(i + 1), t));
    });
    const convoStart = STAGE_DURATIONS[0] + STAGE_DURATIONS[1];
    const step = STAGE_DURATIONS[2] / (script.length + 1);
    script.forEach((_, i) => timers.current.push(setTimeout(() => setLines(i + 1), convoStart + step * (i + 0.5))));
    timers.current.push(
      setTimeout(() => {
        const timestamp = new Date().toISOString();
        const filled = onComplete(c, timestamp);
        setResult({ filled, timestamp });
      }, t),
    );
  };

  const script = channel ? transcript(firstName, channel) : [];
  const LiveIcon = channel ? CHANNEL_ICON[channel].icon : PhoneCall;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-white shadow-[0_12px_40px_-16px_rgba(99,102,241,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-indigo-50 via-violet-50/40 to-transparent" />
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500">Caracterización con IA</div>
            <div className="text-[15px] font-semibold text-slate-900">Completar caracterización con IA</div>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
          NEXA puede recopilar información faltante mediante conversaciones automatizadas y convertir las respuestas en datos estructurados para enriquecer
          este perfil.
        </p>

        {stage === -1 && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200/70">
                <div className="text-[11px] text-slate-500">Campos pendientes</div>
                <div className="text-lg font-semibold text-rose-600 tabular-nums">{missing}</div>
              </div>
              <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200/70">
                <div className="text-[11px] text-slate-500">Completitud proyectada</div>
                <div className="text-lg font-semibold text-emerald-600 tabular-nums">{score < 91 ? "91 %" : "100 %"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => start(c.id)}
                  disabled={missing === 0}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-indigo-300 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition", c.tone)}>
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-slate-900">{c.label}</span>
                    <span className="block text-[12px] text-slate-500">{c.hint}</span>
                  </span>
                  <span className="text-[12px] font-medium whitespace-nowrap text-indigo-600 opacity-0 transition group-hover:opacity-100">Iniciar →</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              Se solicita autorización expresa antes de recopilar cualquier dato.
            </div>
          </>
        )}

        {stage >= 0 && channel && (
          <div className="mt-4 animate-fade-in">
            <ol className="space-y-2">
              {STAGES.map((label, i) => {
                const done = i < stage || (i === STAGES.length - 1 && stage === STAGES.length - 1);
                const active = i === stage && running;
                return (
                  <li key={label} className={cn("flex items-center gap-2.5 text-[13px] transition", i > stage ? "text-slate-300" : "text-slate-700")}>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        done ? "bg-emerald-500 text-white" : active ? "bg-indigo-100 text-indigo-600" : "bg-slate-100",
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    </span>
                    <span className={cn(active && "font-medium text-indigo-700", done && i === STAGES.length - 1 && "font-semibold text-emerald-700")}>{label}</span>
                  </li>
                );
              })}
            </ol>

            {stage >= 2 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                    <LiveIcon className={cn("h-3.5 w-3.5", CHANNEL_ICON[channel].tone)} />
                    {CHANNEL_SOURCE[channel]} · En vivo
                  </span>
                  {running && channel === "voice" && (
                    <span className="flex items-end gap-0.5">
                      {[0, 1, 2, 3, 4].map((b) => (
                        <span key={b} className="w-0.5 animate-pulse rounded-full bg-violet-500" style={{ height: 6 + ((b * 5) % 9), animationDelay: `${b * 120}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
                <div ref={transcriptRef} className="scrollbar-thin max-h-56 space-y-2 overflow-y-auto p-3">
                  {script.slice(0, lines).map((l, i) => (
                    <div key={i} className={cn("flex animate-slide-up gap-2", l.from === "member" && channel !== "form" && "flex-row-reverse")}>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          l.from === "ai" ? "bg-indigo-100 text-indigo-600" : channel === "form" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600",
                        )}
                      >
                        {l.from === "ai" ? <Bot className="h-3 w-3" /> : channel === "form" ? <Check className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </span>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-2.5 py-1.5 text-[12px] leading-relaxed",
                          l.from === "ai"
                            ? "bg-white text-slate-700 ring-1 ring-slate-200"
                            : channel === "whatsapp"
                              ? "bg-emerald-100/70 text-emerald-950"
                              : channel === "sms"
                                ? "bg-amber-100/70 text-amber-950"
                                : channel === "form"
                                  ? "text-slate-600"
                                  : "bg-violet-100/70 text-violet-950",
                        )}
                      >
                        {l.text}
                      </div>
                    </div>
                  ))}
                  {running && stage === 2 && lines < script.length && (
                    <div className="flex gap-1 pl-7">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 animate-slide-up rounded-xl bg-emerald-50/80 p-3.5 ring-1 ring-inset ring-emerald-600/15">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Perfil actualizado por IA
                </div>
                <div className="mt-0.5 text-[12px] text-emerald-700/80">{result.filled} campos recopilados y estructurados</div>
                <dl className="mt-2.5 grid grid-cols-2 gap-y-1.5 text-[12px]">
                  <dt className="text-emerald-700/70">Fuente</dt>
                  <dd className="font-medium text-emerald-900">{CHANNEL_SOURCE[channel]}</dd>
                  <dt className="text-emerald-700/70">Fecha y hora</dt>
                  <dd className="font-medium text-emerald-900">{formatDateTime(result.timestamp)}</dd>
                  <dt className="text-emerald-700/70">Nivel de confianza</dt>
                  <dd className="font-medium text-emerald-900">94 %</dd>
                  <dt className="text-emerald-700/70">Estado de autorización</dt>
                  <dd className="flex items-center gap-1 font-medium text-emerald-900">
                    <ShieldCheck className="h-3 w-3" /> Otorgada
                  </dd>
                </dl>
                <button
                  onClick={() => {
                    setStage(-1);
                    setChannel(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:text-emerald-900"
                >
                  <RotateCcw className="h-3 w-3" />
                  Volver a los canales
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative border-t border-indigo-100/70 bg-indigo-50/30 px-5 py-2.5 text-[11px] text-slate-500">
        Interacción simulada de demostración · no se contacta a ningún asociado
      </div>
    </div>
  );
}
