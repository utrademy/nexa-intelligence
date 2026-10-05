"use client";

import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUser,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Megaphone,
  Pause,
  PhoneCall,
  PhoneOff,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
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
    "idle" | "calling" | "in-progress" | "processing" | "completed" | "not_answered" | "failed"
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
  const testPhoneInputRef = useRef<HTMLInputElement>(null);

  const [demographics, setDemographics] = useState<{
    cities: { name: string; count: number; percentage: number }[];
    education: { name: string; count: number; percentage: number }[];
    employment: { name: string; count: number; percentage: number }[];
    scores: { name: string; count: number; percentage: number }[];
  } | null>(null);

  // Load saved POC test phone from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexa_poc_phone");
      if (saved && saved.startsWith("+") && saved.length >= 10) {
        setTestPhone(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Cancel active demo call
  const cancelActiveCall = async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    const callToCancel = activeCallId;
    setActiveCallId(null);
    setCallStatus("idle");
    setCallError(null);

    if (callToCancel) {
      try {
        await fetch("/api/voice/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: callToCancel, personId: selectedPerson?.id }),
        });
      } catch (err) {
        console.error("Error cancelling demo call:", err);
      }
    }
  };

  const handleCloseDemoModal = async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (activeCallId && callStatus !== "completed") {
      await cancelActiveCall();
    } else {
      setActiveCallId(null);
      setCallStatus("idle");
      setCallError(null);
    }
    setDemoOpen(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch real campaign execution metrics and demographics
  useEffect(() => {
    if (!open || !campaign) return;
    let isCancelled = false;

    async function loadMetrics() {
      setIsLoadingMetrics(true);
      try {
        const [mRes, aRes] = await Promise.all([
          fetch(`/api/campaigns/metrics?campaignId=${campaign?.id}`),
          fetch(`/api/campaigns/analytics?campaignId=${campaign?.id}`),
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          if (!isCancelled && mData.metrics) {
            setMetrics(mData.metrics);
          }
        }

        if (aRes.ok) {
          const aData = await aRes.json();
          if (!isCancelled && aData.analytics?.demographics) {
            setDemographics(aData.analytics.demographics);
          }
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

  // Load candidate synthetic people for Safe Demo Mode tied to this specific campaign
  useEffect(() => {
    if (!demoOpen || !campaign) return;
    let isCancelled = false;

    async function loadCandidates() {
      setIsLoadingCandidates(true);
      try {
        const res = await fetch(`/api/campaigns/preview?limit=8&campaignId=${campaign?.id}`);
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
  }, [demoOpen, campaign, selectedPerson]);

  if (!campaign) return null;

  // Launch Safe Demo Call using shared voice service
  const handleStartDemoCall = async () => {
    if (!selectedPerson) {
      setCallError("Por favor seleccione un asociado para caracterizar.");
      return;
    }

    const cleanPhone = testPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+") || cleanPhone.length < 10) {
      setCallError("Por favor ingrese un número telefónico de prueba válido con código de país (ej. +57 300 123 4567 o +1 305...).");
      testPhoneInputRef.current?.focus();
      return;
    }

    try {
      localStorage.setItem("nexa_poc_phone", cleanPhone);
    } catch {
      // ignore
    }

    setCallError(null);
    setCallResult(null);
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
          campaignObjective: campaign.objective
            ? campaign.objective.toLowerCase().includes("integral") || campaign.name.toLowerCase().includes("integral")
              ? "integral_100"
              : campaign.objective.toLowerCase().includes("actualiz")
                ? "actualizar_informacion"
                : campaign.objective.toLowerCase().includes("validac") || campaign.objective.toLowerCase().includes("ley 1581")
                  ? "encuesta_validacion"
                  : "completar_caracterizacion"
            : "integral_100",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "No fue posible iniciar la llamada.");
      }

      setActiveCallId(data.callId);

      // Start polling status with extended duration (~20 minutes maximum)
      let pollCount = 0;
      const MAX_POLLS = 400;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          if (callStatus !== "in-progress" && callStatus !== "calling") {
            if (pollRef.current) clearInterval(pollRef.current);
            setCallStatus("failed");
            setCallError("Tiempo de espera agotado.");
            return;
          }
        }

        try {
          const statusRes = await fetch(`/api/voice/status?callId=${data.callId}&personId=${selectedPerson.id}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          // 1. Unanswered / Busy / Rejected
          if (statusData.status === "not_answered" || statusData.notAnswered) {
            if (pollRef.current) clearInterval(pollRef.current);
            setCallStatus("not_answered");
            setCallError(statusData.error || "El asociado no contestó la llamada o la línea estaba ocupada.");
            return;
          }

          // 2. Failed / Error without data
          if (
            (statusData.status === "failed" || statusData.status === "error") &&
            !statusData.hasData &&
            !statusData.dbUpdated
          ) {
            if (pollRef.current) clearInterval(pollRef.current);
            setCallStatus("failed");
            setCallError(statusData.error || "Llamada no completada o interrumpida.");
            return;
          }

          // 3. User rejected consent explicitly
          if (statusData.consentDenied) {
            if (pollRef.current) clearInterval(pollRef.current);
            setCallStatus("not_answered");
            setCallError(statusData.error || "El asociado atendió pero indicó que no autorizaba continuar con la actualización.");
            return;
          }

          // 4. In-progress states
          if (statusData.status === "ringing" || statusData.status === "queued") {
            setCallStatus("calling");
          } else if (statusData.status === "in-progress" || statusData.status === "forwarding") {
            setCallStatus("in-progress");
          }

          // 5. Successful completion (has recorded data or dbUpdated is true)
          if ((statusData.completed && (statusData.hasData || statusData.dbUpdated)) || statusData.dbUpdated) {
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
            }, 1000);
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

        {/* DEMOGRAPHIC PROFILE OF THE CAMPAIGN */}
        {demographics && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-[14px] font-semibold text-slate-900">Perfil demográfico de la audiencia</h4>
                <p className="text-[12px] text-slate-500">Composición y distribución de asociados asignados a esta campaña (Supabase)</p>
              </div>
              <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[11.5px] font-medium text-indigo-700">
                Datos reales en PostgreSQL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Top Cities */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 mb-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <span>Distribución territorial</span>
                </div>
                <div className="space-y-1.5">
                  {demographics.cities.slice(0, 4).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-[11.5px]">
                      <span className="truncate text-slate-600">{c.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{c.percentage}% ({c.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Characterization Scores */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 mb-2">
                  <BarChart3 className="h-4 w-4 text-cyan-600" />
                  <span>Puntajes de caracterización</span>
                </div>
                <div className="space-y-1.5">
                  {demographics.scores.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-[11.5px]">
                      <span className="truncate text-slate-600">{s.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 mb-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span>Situación laboral</span>
                </div>
                <div className="space-y-1.5">
                  {demographics.employment.slice(0, 4).map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-[11.5px]">
                      <span className="truncate text-slate-600">{e.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{e.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDemoModal();
            }
          }}
        >
          <div className="relative flex max-h-[88vh] sm:max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER (FIJO) */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-900">MODO DEMOSTRACIÓN SEGURO</h3>
                  <p className="text-[12px] text-slate-500">Ejecución controlada de llamada con IA para ventas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDemoModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="block text-[12.5px] font-semibold text-slate-700">
                    2. Ingrese el número telefónico de prueba autorizado:
                  </label>
                  {testPhone && testPhone.trim().replace(/\s+/g, "").length >= 10 && (
                    <span className="text-[11px] font-medium text-violet-600">Recordado</span>
                  )}
                </div>
                <input
                  ref={testPhoneInputRef}
                  type="tel"
                  value={testPhone}
                  onChange={(e) => {
                    setTestPhone(e.target.value);
                    if (callError) setCallError(null);
                  }}
                  placeholder="+57 300 123 4567 o +1 305..."
                  disabled={callStatus === "calling" || callStatus === "in-progress" || callStatus === "processing"}
                  className={cn(
                    "mt-1.5 w-full rounded-xl border px-3.5 py-2.5 font-mono text-[14px] text-slate-900 shadow-xs focus:outline-hidden focus:ring-2 disabled:bg-slate-100",
                    callError && callStatus === "idle"
                      ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-300 focus:border-violet-500 focus:ring-violet-500/20"
                  )}
                />
              </div>

              {/* VALIDATION ERROR (VISIBLE IMMEDIATELY IN IDLE STATE) */}
              {callError && callStatus === "idle" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-[12px] text-rose-800 animate-fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span className="font-bold text-rose-900 block">Número telefónico incompleto o inválido:</span>
                    {callError}
                  </div>
                </div>
              )}

              {/* PROGRESS STATUS */}
              {callStatus !== "idle" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2 text-[12.5px]">
                    <div className={cn(
                      "flex items-center gap-2",
                      callStatus === "calling"
                        ? "font-semibold text-violet-700"
                        : callStatus === "not_answered"
                          ? "font-semibold text-amber-700"
                          : callStatus === "failed"
                            ? "font-semibold text-rose-700"
                            : callStatus === "in-progress" || callStatus === "processing" || callStatus === "completed"
                              ? "text-slate-500"
                              : "text-slate-300"
                    )}>
                      {callStatus === "calling" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      ) : callStatus === "not_answered" ? (
                        <PhoneOff className="h-4 w-4 text-amber-600" />
                      ) : callStatus === "failed" ? (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {callStatus === "not_answered"
                        ? "Llamada no contestada o rechazada"
                        : callStatus === "failed"
                          ? "Llamada no completada"
                          : "Iniciando llamada con IA al teléfono de prueba"}
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

              {/* NOT ANSWERED ALERT */}
              {callStatus === "not_answered" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-[12.5px] text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <PhoneOff className="h-4.5 w-4.5 text-amber-600" />
                    Llamada de prueba no contestada o rechazada
                  </div>
                  <p className="mt-1 leading-relaxed text-amber-800">
                    {callError || "El teléfono no contestó o el usuario colgó. No se registraron cambios en las métricas de la campaña."}
                  </p>
                </div>
              )}

              {/* ERROR ALERT */}
              {callStatus === "failed" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-800">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <XCircle className="h-4.5 w-4.5 text-rose-600" />
                    Llamada no completada
                  </div>
                  <p className="mt-1 leading-relaxed text-rose-700">
                    {callError || "Ocurrió un error en la infraestructura de voz."}
                  </p>
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

            {/* MODAL FOOTER (FIJO Y ACCESIBLE SIEMPRE) */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <Button
                variant="ghost"
                onClick={handleCloseDemoModal}
              >
                Cerrar
              </Button>
              {callStatus === "idle" ? (
                <Button variant="ai" onClick={handleStartDemoCall}>
                  <PhoneCall className="h-4 w-4 mr-1.5" />
                  Lanzar llamada de prueba
                </Button>
              ) : callStatus === "not_answered" || callStatus === "failed" ? (
                <Button variant="ai" onClick={handleStartDemoCall}>
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reintentar llamada
                </Button>
              ) : callStatus === "completed" ? (
                <Button onClick={handleCloseDemoModal}>Listo</Button>
              ) : (
                <Button
                  variant="secondary"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  onClick={cancelActiveCall}
                >
                  <PhoneOff className="h-4 w-4 mr-1.5" />
                  Cancelar llamada
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
