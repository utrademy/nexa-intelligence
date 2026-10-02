"use client";

import { Check, FileText, Megaphone, MessageCircle, MessageSquareText, PhoneCall, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AiCampaign, Channel } from "@/lib/types";
import { cn, formatNumber } from "@/lib/format";

const STEPS = ["Objetivo", "Audiencia", "Canales", "Datos a recopilar", "Revisión"];

const CHANNEL_OPTIONS: { id: Channel; label: string; desc: string; icon: typeof PhoneCall; tone: string }[] = [
  { id: "voice", label: "Llamada con IA", desc: "Agente de voz en español con lenguaje natural", icon: PhoneCall, tone: "text-violet-600 bg-violet-50" },
  { id: "whatsapp", label: "WhatsApp", desc: "Flujos conversacionales con mensajes enriquecidos", icon: MessageCircle, tone: "text-emerald-600 bg-emerald-50" },
  { id: "sms", label: "SMS", desc: "Preguntas breves por mensaje de texto", icon: MessageSquareText, tone: "text-amber-600 bg-amber-50" },
  { id: "form", label: "Formulario seguro", desc: "Formulario inteligente cifrado con verificación OTP", icon: FileText, tone: "text-sky-600 bg-sky-50" },
];

interface AudiencePreset {
  id: string;
  name: string;
  description: string;
  size: number;
}

export function CreateCampaignModal({
  open,
  onClose,
  onLaunch,
  audiencePresets,
  collectableFields,
  initialAudience,
}: {
  open: boolean;
  onClose: () => void;
  onLaunch: (campaign: AiCampaign) => void;
  audiencePresets: AudiencePreset[];
  collectableFields: string[];
  initialAudience?: number;
}) {
  const presets: AudiencePreset[] = initialAudience
    ? [{ id: "current", name: "Selección actual de Inteligencia de Personas", description: "Según sus filtros o consulta activa", size: initialAudience }, ...audiencePresets]
    : audiencePresets;

  const [step, setStep] = useState(0);
  const [name, setName] = useState("Actualización laboral y del hogar — 4.º trimestre");
  const [objective, setObjective] = useState("Completar información laboral, de ingresos y del hogar de asociados con vacíos críticos.");
  const [audienceId, setAudienceId] = useState(presets[0].id);
  const [channels, setChannels] = useState<Channel[]>(["whatsapp", "voice"]);
  const [fields, setFields] = useState<string[]>(collectableFields.slice(0, 5));
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const audience = presets.find((p) => p.id === audienceId) ?? presets[0];
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  const lift = Math.max(0.1, ((audience.size * 0.58) / 500000) * 100 * (fields.length / 34));

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setLaunched(false);
      setLaunching(false);
    }, 200);
  };

  const launch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      onLaunch({
        id: `cmp-${Date.now()}`,
        name,
        objective,
        status: "Programada",
        audience: audience.size,
        contacted: 0,
        responded: 0,
        completed: 0,
        channels,
        startDate: "2026-10-05",
        endDate: "2026-11-30",
        owner: "Laura Mantilla",
      });
    }, 1600);
  };

  const canContinue = step === 0 ? name.trim().length > 0 : step === 2 ? channels.length > 0 : step === 3 ? fields.length > 0 : true;

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={launched ? "Campaña programada" : "Crear campaña con IA"}
      subtitle={launched ? "NEXA está preparando las conversaciones para su audiencia." : "Complete información de su población mediante conversaciones con IA."}
      icon={<Megaphone className="h-5 w-5" />}
      footer={
        launched ? (
          <>
            <span className="text-[12px] text-slate-400">Modo demostración · no se contactará a ningún asociado</span>
            <Button onClick={close}>Listo</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={step === 0 ? close : () => setStep(step - 1)}>
              {step === 0 ? "Cancelar" : "Atrás"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>
                Continuar
              </Button>
            ) : (
              <Button variant="ai" onClick={launch} disabled={launching}>
                {launching ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Lanzando…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Lanzar campaña
                  </>
                )}
              </Button>
            )}
          </>
        )
      }
    >
      {launched ? (
        <div className="flex animate-scale-in flex-col items-center py-8 text-center">
          <div className="relative">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <Check className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 max-w-md text-[13.5px] text-slate-500">
            Programada para <b>{formatNumber(audience.size)}</b> asociados en {channels.length} {channels.length > 1 ? "canales" : "canal"}. Las conversaciones inician el
            lunes 5 de octubre a las 8:00 a. m.
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
            {[
              { label: "Respuestas estimadas", value: formatNumber(Math.round(audience.size * 0.69)) },
              { label: "Completados estimados", value: formatNumber(Math.round(audience.size * 0.58)) },
              { label: "Aumento de cobertura", value: `+${lift.toFixed(1).replace(".", ",")} p.p.` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="text-[11px] text-slate-500">{s.label}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("hidden truncate text-[12px] font-medium md:block", i === step ? "text-slate-900" : "text-slate-400")}>{s}</span>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-emerald-300" : "bg-slate-200")} />}
              </div>
            ))}
          </div>

          <div key={step} className="animate-fade-in">
            {step === 0 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[13px] font-medium text-slate-700">Nombre de la campaña</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[14px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-slate-700">Objetivo</span>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                  />
                </label>
                <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50/70 p-3.5 text-[13px] text-indigo-900 ring-1 ring-inset ring-indigo-600/10">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  NEXA generará el guion de la conversación, el texto de autorización y las reglas de validación a partir de su objetivo.
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAudienceId(p.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      audienceId === p.id ? "border-indigo-400 bg-indigo-50/50 ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Users className={cn("h-4 w-4", audienceId === p.id ? "text-indigo-600" : "text-slate-400")} />
                      {audienceId === p.id && <Check className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <div className="mt-3 text-[13.5px] font-semibold text-slate-900">{p.name}</div>
                    <div className="mt-0.5 text-[12px] text-slate-500">{p.description}</div>
                    <div className="mt-3 text-xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {formatNumber(p.size)} <span className="text-[12px] font-normal text-slate-400">asociados</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {CHANNEL_OPTIONS.map((c) => {
                  const on = channels.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setChannels(toggle(channels, c.id))}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
                        on ? "border-indigo-400 bg-indigo-50/40 ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.tone)}>
                        <c.icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-semibold text-slate-900">{c.label}</span>
                        <span className="block text-[12.5px] text-slate-500">{c.desc}</span>
                      </span>
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border transition", on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300")}>
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
                <p className="text-[12.5px] text-slate-500">
                  <b className="text-slate-700">Enrutamiento inteligente:</b> NEXA elige el mejor canal para cada asociado según su edad, historial y canal de contacto
                  preferido, y cambia de canal automáticamente si no obtiene respuesta.
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-3 text-[13px] text-slate-500">Seleccione los campos del perfil que NEXA debe recopilar y estructurar.</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {collectableFields.map((f) => {
                    const on = fields.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => setFields(toggle(fields, f))}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition",
                          on ? "border-indigo-300 bg-indigo-50/50 text-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-300",
                        )}
                      >
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300")}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {[
                    { label: "Campaña", value: name },
                    { label: "Audiencia", value: `${audience.name} · ${formatNumber(audience.size)} asociados` },
                    { label: "Canales", value: channels.map((c) => CHANNEL_OPTIONS.find((o) => o.id === c)!.label).join(", ") },
                    { label: "Campos", value: `${fields.length} campos · ${fields.slice(0, 3).join(", ")}${fields.length > 3 ? "…" : ""}` },
                    { label: "Calendario", value: "5 oct – 30 nov 2026 · lunes a sábado, 8:00–19:00" },
                  ].map((r) => (
                    <div key={r.label} className="flex gap-4 px-4 py-3 text-[13px]">
                      <span className="w-24 shrink-0 text-slate-400">{r.label}</span>
                      <span className="font-medium text-slate-800">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/70 p-3.5 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-600/10">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Cada conversación inicia con una solicitud de autorización expresa, alineada con la Ley 1581 de 2012. Los asociados pueden retirarse en cualquier momento.
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
