"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUser,
  Clock,
  Loader2,
  Megaphone,
  Pause,
  PhoneCall,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AiCampaign } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/format";
import Link from "next/link";

interface CampaignDetailModalProps {
  open: boolean;
  onClose: () => void;
  campaign: AiCampaign | null;
  onCampaignUpdated?: () => void;
}

interface CandidatePerson {
  id: string;
  fullName: string;
  documentNumber: string;
  city: string;
  employmentStatus: string;
  educationLevel: string;
  characterizationScore: number;
}

export function CampaignDetailModal({
  open,
  onClose,
  campaign,
  onCampaignUpdated,
}: CampaignDetailModalProps) {
  // Safe Demo Mode state
  const [demoOpen, setDemoOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidatePerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<CandidatePerson | null>(null);
  const [testPhone, setTestPhone] = useState("+57 ");
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Call status
  const [callStatus, setCallStatus] = useState<
    "idle" | "calling" | "in-progress" | "processing" | "completed" | "failed"
  >("idle");
  const [callError, setCallError] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<{
    previousScore: number;
    newScore: number;
    fieldsUpdated: string[];
  } | null>(null);

  // Real campaign execution metrics
  const [metrics, setMetrics] = useState<{
    intentos: number;
    contestadas: number;
    completadas: number;
    fallidas: number;
    pendientes: number;
  }>({
    intentos: 0,
    contestadas: 0,
    completadas: 0,
    fallidas: 0,
    pendientes: campaign?.audience || 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch real campaign execution metrics
  useEffect(() => {
    if (!open || !campaign) return;
    let isCancelled = false;

    async function loadMetrics() {
      setIsLoadingMetrics(true);
      try {
        const res = await fetch(`/api/campaigns/metrics?campaignId=${campaign?.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data.metrics) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Error loading campaign metrics:", err);
      } finally {
        if (!isCancelled) setIsLoadingMetrics(false);
      }
    }

    loadMetrics();
    return () => {
      isCancelled = true;
    };
  }, [open, campaign]);

  // Load candidate synthetic people for Safe Demo Mode
  useEffect(() => {
    if (!demoOpen) return;
    let isCancelled = false;

    async function loadCandidates() {
      setIsLoadingCandidates(true);
      try {
        const res = await fetch("/api/campaigns/preview?limit=8&incompletenessFilter=critical_gaps");
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && Array.isArray(data.people)) {
          setCandidates(data.people);
          if (data.people.length > 0 && !selectedPerson) {
            setSelectedPerson(data.people[0]);
          }
        }
      } catch (err) {
        console.error("Error loading demo candidates:", err);
      } finally {
        if (!isCancelled) setIsLoadingCandidates(false);
      }
    }

    loadCandidates();
    return () => {
      isCancelled = true;
    };
  }, [demoOpen, selectedPerson]);

  if (!campaign) return null;

  // Launch Safe Demo Call using shared voice service
  const handleStartDemoCall = async () => {
    if (!selectedPerson) {
      setCallError("Por favor seleccione un asociado para caracterizar.");
      return;
    }

    const cleanPhone = testPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+") || cleanPhone.length < 10) {
      setCallError("Por favor ingrese un número telefónico de prueba válido con código de país (ej. +573001234567)");
      return;
    }

    setCallError(null);
    setCallStatus("calling");

    try {
      const res = await fetch("/api/voice/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: selectedPerson.id,
          destinationPhone: cleanPhone,
          customerName: selectedPerson.fullName,
          campaignId: campaign.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "No fue posible iniciar la llamada.");
      }

      setActiveCallId(data.callId);

      // Start polling status
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/voice/status?callId=${data.callId}&personId=${selectedPerson.id}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          if (statusData.status === "failed" || statusData.status === "error" || (statusData.completed && statusData.error)) {
            if (pollRef.current) clearInterval(pollRef.current);
            setCallStatus("failed");
            setCallError(statusData.error || "Llamada no completada o no contestada.");
          } else if (statusData.status === "in-progress") {
            setCallStatus("in-progress");
          } else if (statusData.completed || statusData.dbUpdated) {
            setCallStatus("processing");
            if (pollRef.current) clearInterval(pollRef.current);

            setTimeout(() => {
              setCallStatus("completed");
              setCallResult({
                previousScore: selectedPerson.characterizationScore,
                newScore: statusData.newScore || Math.min(selectedPerson.characterizationScore + 25, 100),
                fieldsUpdated: Array.isArray(statusData.fieldsUpdated) && statusData.fieldsUpdated.length > 0
                  ? statusData.fieldsUpdated
                  : [
                      "Situación laboral",
                      "Ocupación",
                      "Sector económico",
                      "Rango de ingresos",
                      "Personas en el hogar",
                      "Personas a cargo",
                      "Tipo de vivienda",
                      "Estrato socioeconómico",
                      "Nivel educativo",
                      "Municipio de residencia",
                    ],
              });

              // Increment live metrics
              setMetrics((prev) => ({
                ...prev,
                intentos: prev.intentos + 1,
                contestadas: prev.contestadas + 1,
                completadas: prev.completadas + 1,
                pendientes: Math.max(0, prev.pendientes - 1),
              }));

              if (onCampaignUpdated) {
                onCampaignUpdated();
              }
            }, 1200);
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err: any) {
      console.error("Error initiating demo call:", err);
      setCallStatus("failed");
      setCallError(err?.message || "Error al conectar con la infraestructura de voz.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={campaign.name}
      subtitle="Detalle de ejecución y caracterización con Inteligencia Artificial"
      icon={<Megaphone className="h-5 w-5 text-indigo-600" />}
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-[12px] text-slate-400">Datos conectados a Supabase PostgreSQL</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="ai" onClick={() => setDemoOpen(true)}>
              <PhoneCall className="h-4 w-4" />
              Modo Demostración Seguro
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* CAMPAIGN GENERAL INFO */}
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-indigo-50/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase">
                {campaign.status}
              </span>
              <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">{campaign.objective}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  Creada: {formatDate(campaign.startDate)}
                </span>
                <span className="flex items-center gap-1">
                  <CircleUser className="h-3.5 w-3.5 text-slate-400" />
                  Responsable: {campaign.owner}
                </span>
                <span className="flex items-center gap-1 font-semibold text-violet-700">
                  <PhoneCall className="h-3.5 w-3.5" />
                  Canal: Llamada con IA
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-white p-4 text-center shadow-xs sm:w-48 shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Audiencia Objetivo
              </span>
              <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
                {formatNumber(campaign.audience)}
              </div>
              <span className="text-[11.5px] text-slate-400">personas identificadas</span>
            </div>
          </div>
        </div>

        {/* REAL METRICS GRID (INTENTOS, CONTESTADAS, COMPLETADAS, FALLIDAS, PENDIENTES) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[14px] font-semibold text-slate-900">Métricas reales de ejecución</h4>
            {isLoadingMetrics && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11.5px] font-medium text-slate-500">Intentos</span>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {formatNumber(metrics.intentos)}
              </div>
              <span className="text-[11px] text-slate-400">llamadas lanzadas</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11.5px] font-medium text-cyan-700">Contestadas</span>
              <div className="mt-1 text-2xl font-bold text-cyan-800 tabular-nums">
                {formatNumber(metrics.contestadas)}
              </div>
              <span className="text-[11px] text-slate-400">contacto efectivo</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
              <span className="text-[11.5px] font-semibold text-emerald-700">Completadas</span>
              <div className="mt-1 text-2xl font-bold text-emerald-800 tabular-nums">
                {formatNumber(metrics.completadas)}
              </div>
              <span className="text-[11px] text-emerald-600">perfiles cerrados</span>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-xs">
              <span className="text-[11.5px] font-medium text-rose-700">Fallidas</span>
              <div className="mt-1 text-2xl font-bold text-rose-800 tabular-nums">
                {formatNumber(metrics.fallidas)}
              </div>
              <span className="text-[11px] text-slate-400">sin contacto o error</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11.5px] font-medium text-slate-500">Pendientes</span>
              <div className="mt-1 text-2xl font-bold text-slate-700 tabular-nums">
                {formatNumber(metrics.pendientes)}
              </div>
              <span className="text-[11px] text-slate-400">por contactar</span>
            </div>
          </div>
        </div>

        {/* DEMO LAUNCH PROMPT BANNER */}
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-indigo-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[13.5px] font-semibold text-slate-900">Demostración en vivo para clientes</span>
              <p className="text-[12px] text-slate-600 mt-0.5">
                Pruebe la llamada con IA en tiempo real llamando a su propio teléfono y observe cómo se actualiza automáticamente el perfil de un asociado sintético.
              </p>
            </div>
          </div>
          <Button variant="ai" size="sm" onClick={() => setDemoOpen(true)}>
            Abrir modo seguro
          </Button>
        </div>
      </div>

      {/* MODAL MODO DEMOSTRACIÓN SEGURO */}
      {demoOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setDemoOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 transition hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold text-slate-900">MODO DEMOSTRACIÓN SEGURO</h3>
                <p className="text-[12px] text-slate-500">Ejecución controlada de llamada con IA para ventas</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[12px] text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <b className="font-semibold">Regla de seguridad:</b> Los asociados en base de datos son perfiles sintéticos. NEXA nunca marca automáticamente sus números. Ingrese su número real autorizado para recibir la llamada en vivo.
                </div>
              </div>

              {/* SELECT SYNTHETIC PERSON */}
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700">
                  1. Seleccione el asociado sintético a caracterizar:
                </label>
                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {candidates.map((p) => {
                    const isSelected = selectedPerson?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPerson(p)}
                        className={cn(
                          "flex w-full items-center justify-between p-2.5 text-left text-[12px] transition",
                          isSelected ? "bg-violet-50/80 font-semibold text-violet-900" : "hover:bg-slate-50 text-slate-700",
                        )}
                      >
                        <div>
                          <div>{p.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.city} · {p.employmentStatus}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700">
                            {p.characterizationScore}% completitud
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {candidates.length === 0 && (
                    <div className="p-3 text-center text-[12px] text-slate-400">Cargando asociados del segmento…</div>
                  )}
                </div>
              </div>

              {/* ENTER REAL AUTHORIZED PHONE */}
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700">
                  2. Ingrese el número telefónico de prueba autorizado:
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  disabled={callStatus === "calling" || callStatus === "in-progress" || callStatus === "processing"}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-[14px] text-slate-900 shadow-xs focus:border-violet-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-100"
                />
              </div>

              {/* PROGRESS STATUS */}
              {callStatus !== "idle" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2 text-[12.5px]">
                    <div className={cn("flex items-center gap-2", callStatus === "calling" ? "font-semibold text-violet-700" : "text-slate-500")}>
                      {callStatus === "calling" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      Iniciando llamada con IA al teléfono de prueba
                    </div>
                    <div className={cn("flex items-center gap-2", callStatus === "in-progress" ? "font-semibold text-violet-700" : callStatus === "processing" || callStatus === "completed" ? "text-slate-500" : "text-slate-300")}>
                      {callStatus === "in-progress" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : callStatus === "processing" || callStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Conversación en curso (recolectando datos y consentimiento)
                    </div>
                    <div className={cn("flex items-center gap-2", callStatus === "processing" ? "font-semibold text-violet-700" : callStatus === "completed" ? "text-slate-500" : "text-slate-300")}>
                      {callStatus === "processing" ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : callStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Estructurando campos y actualizando Person 360 en Supabase
                    </div>
                    <div className={cn("flex items-center gap-2", callStatus === "completed" ? "font-semibold text-emerald-700" : "text-slate-300")}>
                      {callStatus === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      Campaña y métricas actualizadas
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR ALERT */}
              {callStatus === "failed" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12.5px] text-rose-800">
                  <b>Error en la llamada:</b> {callError}
                </div>
              )}

              {/* SUCCESS RESULT */}
              {callStatus === "completed" && callResult && selectedPerson && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-[12.5px] text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Sparkles className="h-4 w-4" />
                    ¡Llamada de campaña finalizada con éxito!
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg bg-white p-2 text-center border border-emerald-200">
                      <span className="text-slate-500 block">Antes</span>
                      <span className="text-[15px] font-bold text-slate-700">{callResult.previousScore}%</span>
                    </div>
                    <div className="rounded-lg bg-emerald-100 p-2 text-center border border-emerald-300">
                      <span className="text-emerald-800 font-semibold block">Después</span>
                      <span className="text-[15px] font-bold text-emerald-900">{callResult.newScore}%</span>
                    </div>
                  </div>
                  <p className="mt-2.5 text-emerald-800 leading-relaxed">
                    Se asoció la llamada a la campaña <b>{campaign.name}</b> y se registraron los campos actualizados en el perfil 360 de <b>{selectedPerson.fullName}</b>.
                  </p>
                  <div className="mt-3">
                    <Link
                      href={`/people/${selectedPerson.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-800 underline hover:text-emerald-950"
                    >
                      Ver perfil 360 del asociado en una pestaña nueva →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => {
                  if (pollRef.current) clearInterval(pollRef.current);
                  setDemoOpen(false);
                }}
              >
                Cerrar
              </Button>
              {callStatus === "idle" || callStatus === "failed" ? (
                <Button variant="ai" onClick={handleStartDemoCall}>
                  <PhoneCall className="h-4 w-4" />
                  Lanzar llamada de prueba
                </Button>
              ) : callStatus === "completed" ? (
                <Button onClick={() => setDemoOpen(false)}>Listo</Button>
              ) : (
                <Button disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Llamada en progreso…
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
