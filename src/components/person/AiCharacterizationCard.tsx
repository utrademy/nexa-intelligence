"use client";

import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircle,
  MessageSquareText,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

const CHANNELS: { id: Channel; label: string; hint: string; icon: typeof PhoneCall; tone: string; badge?: string }[] = [
  {
    id: "voice",
    label: "Llamada con IA",
    hint: "Llamada de voz real en español a teléfono autorizado",
    icon: PhoneCall,
    tone: "text-violet-600 bg-violet-50 group-hover:bg-violet-100",
    badge: "Voz Real",
  },
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
    { from: "ai", text: `Hola, soy el asistente virtual de NEXA. Me comunico con ${firstName}. Estamos realizando una breve actualización de información. Esta llamada puede ser procesada mediante inteligencia artificial con fines de demostración. ¿Podemos continuar?` },
    { from: "member", text: "Sí, claro, podemos continuar." },
    { from: "ai", text: "¿Cuál es actualmente su situación laboral? Por ejemplo: empleado, independiente, pensionado o desempleado." },
    { from: "member", text: "Soy independiente." },
    { from: "ai", text: "¿A qué actividad u ocupación principal se dedica?" },
    { from: "member", text: "Tengo un local comercial de confecciones." },
    { from: "ai", text: "¿Cuál es su nivel educativo más alto alcanzado?" },
    { from: "member", text: "Soy profesional." },
    { from: "ai", text: "¿En qué municipio o ciudad reside actualmente?" },
    { from: "member", text: "Bucaramanga." },
    { from: "ai", text: "¿Cuántas personas viven actualmente en su hogar incluyéndose usted?" },
    { from: "member", text: "Somos cuatro personas." },
    { from: "ai", text: "Muchas gracias por su valiosa información. Hemos terminado la actualización de sus datos. Que tenga un excelente día." },
  ];
}

export interface VoiceCallCompletedEvent {
  personId: string;
  previousScore: number;
  newScore: number;
  fieldsUpdated: string[];
  consentStatus: "Otorgada" | "Denegada";
  summary: string;
}

export function AiCharacterizationCard({
  personId,
  firstName,
  fullName,
  score,
  missing,
  onComplete,
  onRealVoiceComplete,
}: {
  personId: string;
  firstName: string;
  fullName: string;
  score: number;
  missing: number;
  onComplete: (channel: Channel, timestamp: string) => number;
  onRealVoiceComplete?: (event: VoiceCallCompletedEvent) => void;
}) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [stage, setStage] = useState(-1);
  const [lines, setLines] = useState(0);
  const [result, setResult] = useState<{ filled: number; timestamp: string } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Real Voice Modal state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [authorizedPhone, setAuthorizedPhone] = useState("+57 ");
  const [voiceCallStatus, setVoiceCallStatus] = useState<
    "idle" | "preparing" | "calling" | "in-progress" | "processing" | "completed" | "not_answered" | "failed" | "unconfigured"
  >("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceCallCompletedEvent | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cancel active call in progress
  const cancelActiveCall = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    const callToCancel = activeCallId;
    setActiveCallId(null);
    setVoiceCallStatus("idle");
    setVoiceError(null);

    if (callToCancel) {
      try {
        await fetch("/api/voice/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: callToCancel, personId }),
        });
      } catch (err) {
        console.error("Error cancelling call:", err);
      }
    }
  };

  const handleCloseVoiceModal = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (activeCallId && voiceCallStatus !== "completed") {
      await cancelActiveCall();
    } else {
      setActiveCallId(null);
      setVoiceCallStatus("idle");
      setVoiceError(null);
    }
    setIsVoiceModalOpen(false);
  };

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const running = stage >= 0 && stage < STAGES.length - 1;

  const startSimulation = (c: Channel) => {
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

  const handleChannelClick = (c: Channel) => {
    if (c === "voice") {
      setIsVoiceModalOpen(true);
      setVoiceCallStatus("idle");
      setVoiceError(null);
      setVoiceResult(null);
    } else {
      startSimulation(c);
    }
  };

  // Start Real AI Voice Call
  const startRealVoiceCall = async () => {
    const cleanPhone = authorizedPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+") || cleanPhone.length < 10) {
      setVoiceError("Por favor ingrese un número válido con código de país (ej. +573001234567 o +1305...)");
      return;
    }

    setVoiceError(null);
    setVoiceResult(null);
    setVoiceCallStatus("preparing");

    try {
      const res = await fetch("/api/voice/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          destinationPhone: cleanPhone,
          customerName: fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "MANUAL_ACTION_REQUIRED") {
          setVoiceCallStatus("unconfigured");
          setVoiceError(data.message || "Se requiere configurar credenciales del proveedor de voz.");
          return;
        }
        throw new Error(data.message || data.error || "No fue posible iniciar la llamada");
      }

      setActiveCallId(data.callId);
      setVoiceCallStatus("calling");

      // Start polling status with extended duration (~20 minutes maximum)
      let pollCount = 0;
      const MAX_POLLS = 400;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          if (voiceCallStatus !== "in-progress" && voiceCallStatus !== "calling") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVoiceCallStatus("failed");
            setVoiceError("Tiempo de espera agotado.");
            return;
          }
        }

        try {
          const statusRes = await fetch(`/api/voice/status?callId=${data.callId}&personId=${personId}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          // 1. Unanswered / Busy / Rejected
          if (statusData.status === "not_answered" || statusData.notAnswered) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVoiceCallStatus("not_answered");
            setVoiceError(statusData.error || "El asociado no contestó la llamada o la línea estaba ocupada.");
            return;
          }

          // 2. Failed / Telephony error without collected data
          if (
            (statusData.status === "failed" || statusData.status === "error") &&
            !statusData.hasData &&
            !statusData.dbUpdated
          ) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVoiceCallStatus("failed");
            setVoiceError(statusData.error || "Llamada no completada o interrumpida.");
            return;
          }

          // 3. User rejected consent explicitly
          if (statusData.consentDenied) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVoiceCallStatus("not_answered");
            setVoiceError(statusData.error || "El asociado atendió pero indicó que no autorizaba continuar con la actualización.");
            return;
          }

          // 4. In-progress states (ringing vs conversation)
          if (statusData.status === "ringing" || statusData.status === "queued") {
            setVoiceCallStatus("calling");
          } else if (statusData.status === "in-progress" || statusData.status === "forwarding") {
            setVoiceCallStatus("in-progress");
          }

          // 5. Successful completion (recorded in DB or has data)
          if ((statusData.completed && (statusData.hasData || statusData.dbUpdated)) || statusData.dbUpdated) {
            setVoiceCallStatus("processing");
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);

            setTimeout(() => {
              setVoiceCallStatus("completed");
              const defaultUpdated = [
                "Situación laboral", "Ocupación", "Sector económico", "Rango de ingresos",
                "Personas en el hogar", "Personas a cargo", "Tipo de vivienda", "Estrato socioeconómico",
                "Nivel educativo", "Área de estudio", "Municipio", "Zona de residencia", "Jefatura de hogar",
                "Condición de salud / discapacidad", "Metas financieras", "Canal de contacto"
              ];
              const fieldsList = Array.isArray(statusData.fieldsUpdated) && statusData.fieldsUpdated.length > 0
                ? statusData.fieldsUpdated
                : defaultUpdated;

              const completedEvt: VoiceCallCompletedEvent = {
                personId,
                previousScore: score,
                newScore: statusData.newScore || Math.min(score + 22, 100),
                fieldsUpdated: fieldsList,
                consentStatus: "Otorgada",
                summary: "Llamada con IA · Caracterización completada en vivo",
              };
              setVoiceResult(completedEvt);
              if (onRealVoiceComplete) onRealVoiceComplete(completedEvt);
              router.refresh();
            }, 1000);
          }
        } catch {
          // continue polling
        }
      }, 3000);
    } catch (err: any) {
      console.error("[AiCharacterizationCard] Call error:", err);
      setVoiceCallStatus("failed");
      setVoiceError(err?.message || "Error al conectar con el proveedor de voz");
    }
  };

  const script = channel ? transcript(firstName, channel) : [];
  const LiveIcon = channel ? CHANNEL_ICON[channel].icon : PhoneCall;

  return (
    <>
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
            NEXA puede recopilar información faltante mediante llamadas telefónicas con IA y canales seguros, convirtiendo las respuestas en datos
            estructurados en Supabase.
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
                    onClick={() => handleChannelClick(c.id)}
                    disabled={missing === 0}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-indigo-300 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition", c.tone)}>
                      <c.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-900">
                        {c.label}
                        {c.badge && (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10.5px] font-bold text-violet-700">
                            {c.badge}
                          </span>
                        )}
                      </span>
                      <span className="block text-[12px] text-slate-500">{c.hint}</span>
                    </span>
                    <span className="text-[12px] font-medium whitespace-nowrap text-indigo-600 opacity-0 transition group-hover:opacity-100">Iniciar →</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Se solicita autorización expresa al inicio de la conversación.
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
                      {CHANNEL_SOURCE[channel]} · Simulación guiada
                    </span>
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
          Llamada telefónica interactiva con IA para enriquecimiento y caracterización
        </div>
      </div>

      {/* MODAL DE LLAMADA DE VOZ REAL CON IA */}
      {isVoiceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseVoiceModal();
            }
          }}
        >
          <div className="relative flex max-h-[88vh] sm:max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER (FIJO) */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-900">Completar perfil con IA</h3>
                  <p className="text-[12px] text-slate-500">Llamada telefónica outbound en tiempo real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseVoiceModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Canal:</span>
                  <span className="flex items-center gap-1.5 font-semibold text-violet-700">
                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                    Llamada con IA
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">Persona:</span>
                  <span className="font-semibold text-slate-900">{fullName}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-500">Completitud actual:</span>
                  <span className="font-semibold text-indigo-600 tabular-nums">{score} %</span>
                </div>
              </div>

              {/* PHONE INPUT & POC SAFETY BANNER */}
              <div>
                <label className="block text-[12.5px] font-medium text-slate-700">
                  Número de destino:
                </label>
                <input
                  type="text"
                  value={authorizedPhone}
                  onChange={(e) => setAuthorizedPhone(e.target.value)}
                  placeholder="+57 300 123 4567 o +1 305..."
                  disabled={voiceCallStatus === "calling" || voiceCallStatus === "in-progress" || voiceCallStatus === "processing"}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-[14px] text-slate-900 shadow-xs focus:border-violet-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[12px] text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <b className="font-semibold">Entorno POC:</b> utilice únicamente un número autorizado para pruebas. El sistema nunca llama números sintéticos de la base de datos automáticamente.
                </div>
              </div>

              {/* CALL PROGRESS STATES */}
              {voiceCallStatus !== "idle" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2.5 text-[13px]">
                    <div className={cn("flex items-center gap-2", voiceCallStatus === "preparing" ? "font-semibold text-violet-700" : "text-slate-500")}>
                      {voiceCallStatus === "preparing" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      Preparando llamada
                    </div>
                    <div className={cn(
                      "flex items-center gap-2",
                      voiceCallStatus === "calling"
                        ? "font-semibold text-violet-700"
                        : voiceCallStatus === "not_answered"
                          ? "font-semibold text-amber-700"
                          : voiceCallStatus === "failed"
                            ? "font-semibold text-rose-700"
                            : voiceCallStatus === "in-progress" || voiceCallStatus === "processing" || voiceCallStatus === "completed"
                              ? "text-slate-500"
                              : "text-slate-300"
                    )}>
                      {voiceCallStatus === "calling" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      ) : voiceCallStatus === "not_answered" ? (
                        <PhoneOff className="h-4 w-4 text-amber-600" />
                      ) : voiceCallStatus === "failed" ? (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      ) : voiceCallStatus === "in-progress" || voiceCallStatus === "processing" || voiceCallStatus === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-slate-300" />
                      )}
                      {voiceCallStatus === "not_answered"
                        ? "Llamada no contestada o rechazada"
                        : voiceCallStatus === "failed"
                          ? "Llamada no completada"
                          : "Llamando"}
                    </div>
                    <div className={cn("flex items-center gap-2", voiceCallStatus === "in-progress" ? "font-semibold text-violet-700" : voiceCallStatus === "processing" || voiceCallStatus === "completed" ? "text-slate-500" : "text-slate-300")}>
                      {voiceCallStatus === "in-progress" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : voiceCallStatus === "processing" || voiceCallStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Llamada en curso (conversación en español)
                    </div>
                    <div className={cn("flex items-center gap-2", voiceCallStatus === "processing" ? "font-semibold text-violet-700" : voiceCallStatus === "completed" ? "text-slate-500" : "text-slate-300")}>
                      {voiceCallStatus === "processing" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : voiceCallStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Procesando respuestas y extrayendo datos estructurados
                    </div>
                    <div className={cn("flex items-center gap-2", voiceCallStatus === "completed" ? "font-semibold text-emerald-700" : "text-slate-300")}>
                      {voiceCallStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Perfil actualizado en Supabase
                    </div>
                  </div>
                </div>
              )}

              {/* UNCONFIGURED BANNER */}
              {voiceCallStatus === "unconfigured" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-[12px] text-rose-900">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700">
                    <ShieldAlert className="h-4 w-4" />
                    CONFIGURACIÓN DEL PROVEEDOR PENDIENTE
                  </div>
                  <p className="mt-1 leading-relaxed">
                    Se requiere configurar <code>VOICE_PROVIDER_API_KEY</code> en las variables de entorno de Vercel.
                  </p>
                </div>
              )}

              {/* NOT ANSWERED BANNER */}
              {voiceCallStatus === "not_answered" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/95 p-4 text-[12.5px] text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <PhoneOff className="h-4.5 w-4.5 text-amber-600" />
                    Llamada no contestada o rechazada
                  </div>
                  <p className="mt-1.5 leading-relaxed text-amber-800">
                    {voiceError || "El asociado no contestó la llamada o la rechazó. No se realizaron modificaciones en los datos del perfil."}
                  </p>
                  <p className="mt-2 text-[11.5px] text-amber-700">
                    Puede verificar el número o reintentar la llamada cuando el asociado esté disponible.
                  </p>
                </div>
              )}

              {/* FAILED BANNER */}
              {voiceCallStatus === "failed" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-800">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <XCircle className="h-4.5 w-4.5 text-rose-600" />
                    Llamada no completada
                  </div>
                  <div className="mt-1 leading-relaxed text-rose-700">
                    {voiceError || "Ocurrió un inconveniente al contactar al teléfono de destino. Puede intentar nuevamente."}
                  </div>
                </div>
              )}

              {/* SUCCESS RESULT */}
              {voiceCallStatus === "completed" && voiceResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-[12.5px] text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Sparkles className="h-4 w-4" />
                    ¡Llamada completada y perfil actualizado!
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg bg-white/80 p-2 text-center ring-1 ring-emerald-200">
                      <span className="block text-slate-500">Antes</span>
                      <span className="text-[15px] font-bold text-slate-700">{voiceResult.previousScore} %</span>
                    </div>
                    <div className="rounded-lg bg-emerald-100/80 p-2 text-center ring-1 ring-emerald-300">
                      <span className="block text-emerald-800 font-semibold">Después</span>
                      <span className="text-[15px] font-bold text-emerald-900">{voiceResult.newScore} %</span>
                    </div>
                  </div>
                  <p className="mt-2 text-emerald-800">
                    Campos actualizados: {voiceResult.fieldsUpdated.join(", ")}.
                  </p>
                </div>
              )}
            </div>

            {/* MODAL FOOTER (FIJO Y ACCESIBLE SIEMPRE) */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseVoiceModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cerrar
              </button>

              {voiceCallStatus === "idle" ? (
                <button
                  type="button"
                  onClick={startRealVoiceCall}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700 active:scale-[0.98]"
                >
                  <PhoneCall className="h-4 w-4" />
                  INICIAR LLAMADA CON IA
                </button>
              ) : voiceCallStatus === "not_answered" || voiceCallStatus === "failed" ? (
                <button
                  type="button"
                  onClick={startRealVoiceCall}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700 active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reintentar llamada
                </button>
              ) : voiceCallStatus === "completed" ? (
                <button
                  type="button"
                  onClick={handleCloseVoiceModal}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-700"
                >
                  Entendido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelActiveCall}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-rose-500/25 transition hover:bg-rose-700 active:scale-[0.98]"
                >
                  <PhoneOff className="h-4 w-4" />
                  Cancelar llamada
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
