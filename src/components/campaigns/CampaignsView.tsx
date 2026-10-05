"use client";

import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ChevronDown,
  CircleUser,
  GraduationCap,
  Layers,
  Loader2,
  MapPin,
  Megaphone,
  PhoneCall,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaSeriesChart, BarSeriesChart, ChartLegend, DonutChart, LineSeriesChart } from "@/components/charts/Charts";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import type { AiCampaign, CampaignInteraction, Channel, InteractionStatus, Kpi } from "@/lib/types";
import { cn, formatDate, formatNumber, formatTime } from "@/lib/format";
import { CampaignCard } from "./CampaignCard";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { CampaignDetailModal } from "./CampaignDetailModal";

const STATUS_FILTERS: ("Todos" | InteractionStatus)[] = [
  "Todos",
  "Completado",
  "En progreso",
  "Sin respuesta",
  "No desea participar",
  "Requiere revisión",
];

export interface DemographicItem {
  name: string;
  count: number;
  percentage: number;
}

export interface CampaignDemographics {
  cities: DemographicItem[];
  education: DemographicItem[];
  employment: DemographicItem[];
  scores: DemographicItem[];
}

interface CampaignsViewProps {
  campaigns: AiCampaign[];
  featured: AiCampaign;
  progress: { day: string; contacted: number; responded: number; completed: number }[];
  channels: { channel: string; key: Channel; contacted: number; responded: number; completed: number }[];
  outcomes: { status: InteractionStatus; value: number; color: string }[];
  responseRate: { week: string; voice: number; whatsapp: number; form: number }[];
  demographics?: CampaignDemographics;
  interactions: CampaignInteraction[];
  audiencePresets: { id: string; name: string; description: string; size: number }[];
  collectableFields: string[];
  initialCampaignId?: string;
  initialCreate?: boolean;
  initialAudience?: number;
}

export function CampaignsView(props: CampaignsViewProps) {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<AiCampaign[]>(props.campaigns);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(
    props.initialCampaignId || props.featured.id,
  );
  const [featured, setFeatured] = useState<AiCampaign>(props.featured);
  const [progress, setProgress] = useState(props.progress);
  const [channels, setChannels] = useState(props.channels);
  const [outcomes, setOutcomes] = useState(props.outcomes);
  const [responseRate, setResponseRate] = useState(props.responseRate);
  const [demographics, setDemographics] = useState<CampaignDemographics | undefined>(
    props.demographics,
  );
  const [interactions, setInteractions] = useState<CampaignInteraction[]>(props.interactions);
  const [isSwitching, setIsSwitching] = useState(false);

  const [createOpen, setCreateOpen] = useState(!!props.initialCreate);
  const [selectedCampaign, setSelectedCampaign] = useState<AiCampaign | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("Todos");

  // Switch active campaign and load real-time analytics from Supabase
  const handleSwitchCampaign = async (campaignId: string) => {
    if (campaignId === activeCampaignId && !isSwitching) return;
    setActiveCampaignId(campaignId);
    setIsSwitching(true);

    const localFound = campaigns.find((c) => c.id === campaignId);
    if (localFound) {
      setFeatured(localFound);
    }

    try {
      const res = await fetch(`/api/campaigns/analytics?campaignId=${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setFeatured(data.campaign);
          setCampaigns((prev) =>
            prev.map((c) => (c.id === data.campaign.id ? { ...c, ...data.campaign } : c)),
          );
        }
        if (data.analytics) {
          setProgress(data.analytics.progress || []);
          setChannels(data.analytics.channels || []);
          setOutcomes(data.analytics.outcomes || []);
          setResponseRate(data.analytics.responseRate || []);
          if (data.analytics.demographics) {
            setDemographics(data.analytics.demographics);
          }
        }
        if (Array.isArray(data.interactions)) {
          setInteractions(data.interactions);
        }
      }

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("campaignId", campaignId);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err) {
      console.error("Error switching campaign analytics:", err);
      toast.show("No fue posible actualizar la analítica de la campaña");
    } finally {
      setIsSwitching(false);
    }
  };

  const contactedRate =
    featured.audience > 0 ? Math.round((featured.contacted / featured.audience) * 100) : 0;
  const responseRatePct =
    featured.contacted > 0 ? Math.round((featured.responded / featured.contacted) * 100) : 0;
  const completionRatePct =
    featured.contacted > 0 ? Math.round((featured.completed / featured.contacted) * 100) : 0;
  const completionOfAudience =
    featured.audience > 0 ? Math.round((featured.completed / featured.audience) * 100) : 0;

  const kpis: Kpi[] = [
    {
      id: "targeted",
      label: "Objetivo",
      value: formatNumber(featured.audience),
      icon: "target",
      tone: "slate",
      hint: "Asociados en la audiencia",
    },
    {
      id: "contacted",
      label: "Contactados",
      value: formatNumber(featured.contacted),
      icon: "send",
      tone: "indigo",
      delta: `${contactedRate} %`,
      trend: "up",
      hint: "de la audiencia alcanzada",
    },
    {
      id: "responded",
      label: "Respondieron",
      value: formatNumber(featured.responded),
      icon: "reply",
      tone: "cyan",
      delta: `${responseRatePct} %`,
      trend: "up",
      hint: "tasa de respuesta",
    },
    {
      id: "completed",
      label: "Completados",
      value: formatNumber(featured.completed),
      icon: "check",
      tone: "emerald",
      delta: `${completionRatePct} %`,
      trend: "up",
      hint: "perfiles actualizados por completo",
    },
    {
      id: "completion",
      label: "Tasa de finalización",
      value: `${completionRatePct} %`,
      icon: "percent",
      tone: "violet",
      delta: `${completionOfAudience} % meta`,
      trend: "flat",
      hint: "efectividad sobre contactados",
    },
  ];

  const counts = useMemo(() => {
    const c: Record<string, number> = { Todos: interactions.length };
    interactions.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [interactions]);

  const statusBreakdown = outcomes.map((o) => ({ name: o.status, value: o.value, color: o.color }));

  const visible =
    statusFilter === "Todos" ? interactions : interactions.filter((i) => i.status === statusFilter);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* HEADER */}
      <div className="flex animate-fade-in flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
            Campañas de Caracterización con IA
          </h2>
          <p className="mt-1 text-[14px] text-slate-500">
            Supervise métricas por campaña, demografía de asociados y ejecute llamadas seguras con IA conectadas a Supabase.
          </p>
        </div>
        <Button variant="ai" size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear campaña con IA
        </Button>
      </div>

      {/* CAMPAIGN SWITCHER TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                Campaña activa en tablero
              </span>
              {isSwitching && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Cargando métricas...
                </span>
              )}
            </div>
            <div className="text-[14.5px] font-semibold text-slate-900 line-clamp-1">
              {featured.name}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Dropdown Selector */}
          <div className="relative">
            <select
              value={activeCampaignId}
              onChange={(e) => handleSwitchCampaign(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-3.5 pr-8 text-[13px] font-medium text-slate-800 transition hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatNumber(c.audience)} asociados)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Quick tab switcher pills */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100/80">
            {campaigns.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSwitchCampaign(c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition cursor-pointer whitespace-nowrap",
                  activeCampaignId === c.id
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
                )}
              >
                <span className="truncate max-w-[130px]">{c.name}</span>
                <span
                  className={cn(
                    "rounded px-1 text-[10px] tabular-nums",
                    activeCampaignId === c.id
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-200/70 text-slate-600",
                  )}
                >
                  {formatNumber(c.audience)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED / ACTIVE CAMPAIGN HERO CARD */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">{featured.name}</h3>
                <StatusBadge status={featured.status} />
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                  Activa en panel
                </span>
              </div>
              <p className="mt-1 text-[13.5px] text-slate-500">{featured.objective}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-slate-500">
                <span>
                  Audiencia <b className="text-slate-800">{formatNumber(featured.audience)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(featured.startDate)} – {formatDate(featured.endDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CircleUser className="h-3.5 w-3.5" />
                  {featured.owner}
                </span>
                <span className="flex gap-1">
                  {featured.channels.map((c) => (
                    <ChannelBadge key={c} channel={c} />
                  ))}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setSelectedCampaign(featured)}>
              Ver detalle
            </Button>
            <Button variant="ai" onClick={() => setSelectedCampaign(featured)}>
              <PhoneCall className="h-4 w-4" />
              Modo seguro
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k, i) => (
            <KpiCard key={k.id} kpi={k} index={i} />
          ))}
        </div>
      </Card>

      {/* CHARTS: AVANCE Y RESULTADOS */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`Avance — ${featured.name}`}
            subtitle="Contactos, respuestas y perfiles completados acumulados"
            action={
              <ChartLegend
                items={[
                  { name: "Contactados", color: "#6366f1" },
                  { name: "Respondieron", color: "#06b6d4" },
                  { name: "Completados", color: "#10b981" },
                ]}
              />
            }
          />
          <div className="p-4">
            <AreaSeriesChart
              data={progress}
              xKey="day"
              height={270}
              series={[
                { key: "contacted", name: "Contactados", color: "#6366f1" },
                { key: "responded", name: "Respondieron", color: "#06b6d4" },
                { key: "completed", name: "Completados", color: "#10b981" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Resultados" subtitle="Estado de los asociados en esta campaña" />
          <div className="px-6 pt-2 pb-6">
            <DonutChart
              data={statusBreakdown}
              centerValue={`${completionRatePct} %`}
              centerLabel="Completados"
              height={200}
            />
            <div className="mt-4 space-y-2">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatNumber(s.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* DEMOGRAPHICS PER CAMPAIGN */}
      {demographics && (
        <Card>
          <CardHeader
            title="Perfil demográfico de la audiencia — Supabase"
            subtitle={`Distribución territorial, laboral y nivel de completitud de los ${formatNumber(featured.audience)} asociados de esta campaña`}
            action={
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-[11.5px] font-medium text-indigo-700">
                Segmentación activa: {featured.name}
              </span>
            }
          />
          <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Territorial Distribution */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <h4 className="text-[13px] font-semibold text-slate-900">Distribución territorial</h4>
              </div>
              <div className="space-y-2.5">
                {demographics.cities.map((city) => (
                  <div key={city.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-600 truncate">{city.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {city.percentage}% ({formatNumber(city.count)})
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.min(100, city.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Characterization Score Distribution */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-cyan-600" />
                <h4 className="text-[13px] font-semibold text-slate-900">Puntaje de caracterización</h4>
              </div>
              <div className="space-y-2.5">
                {demographics.scores.map((sc) => (
                  <div key={sc.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-600 truncate">{sc.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {sc.percentage}% ({formatNumber(sc.count)})
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-cyan-500"
                        style={{ width: `${Math.min(100, sc.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Employment Status */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <h4 className="text-[13px] font-semibold text-slate-900">Situación laboral</h4>
              </div>
              <div className="space-y-2.5">
                {demographics.employment.map((emp) => (
                  <div key={emp.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-600 truncate">{emp.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {emp.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, emp.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Education Level */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-violet-600" />
                <h4 className="text-[13px] font-semibold text-slate-900">Nivel de instrucción</h4>
              </div>
              <div className="space-y-2.5">
                {demographics.education.map((edu) => (
                  <div key={edu.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-600 truncate">{edu.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {edu.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${Math.min(100, edu.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* CHARTS: DESEMPEÑO POR CANAL Y TASA DE RESPUESTA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Desempeño por canal"
            subtitle="Contactados, respondieron y completados por canal"
            action={
              <ChartLegend
                items={[
                  { name: "Contactados", color: "#c7d2fe" },
                  { name: "Respondieron", color: "#8b5cf6" },
                  { name: "Completados", color: "#10b981" },
                ]}
              />
            }
          />
          <div className="p-4">
            <BarSeriesChart
              data={channels}
              xKey="channel"
              height={250}
              series={[
                { key: "contacted", name: "Contactados", color: "#c7d2fe" },
                { key: "responded", name: "Respondieron", color: "#8b5cf6" },
                { key: "completed", name: "Completados", color: "#10b981" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Tasa de respuesta"
            subtitle="Tasa de respuesta semanal por canal"
            action={
              <ChartLegend
                items={[
                  { name: "WhatsApp", color: "#10b981" },
                  { name: "SMS / Formulario", color: "#0ea5e9" },
                  { name: "Llamada con IA", color: "#8b5cf6" },
                ]}
              />
            }
          />
          <div className="p-4">
            <LineSeriesChart
              data={responseRate}
              xKey="week"
              unit="%"
              height={250}
              domain={[0, 100]}
              series={[
                { key: "whatsapp", name: "WhatsApp", color: "#10b981" },
                { key: "form", name: "SMS / Formulario", color: "#0ea5e9" },
                { key: "voice", name: "Llamada con IA", color: "#8b5cf6" },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* LIVE CONVERSATION LOGS */}
      <Card className="overflow-hidden">
        <CardHeader
          title={`Registro de conversaciones — ${featured.name}`}
          subtitle="Interacciones con IA en vivo vinculadas a esta campaña · Supabase"
        />
        <div className="scrollbar-thin mt-4 flex gap-1.5 overflow-x-auto px-6 pb-4">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition cursor-pointer",
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {s}
              <span
                className={cn(
                  "rounded px-1 text-[11px] tabular-nums",
                  statusFilter === s ? "bg-white/20" : "bg-white text-slate-500",
                )}
              >
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="scrollbar-thin max-h-[520px] overflow-auto">
          {visible.length === 0 ? (
            <div className="py-12 text-center text-[13.5px] text-slate-500">
              No se registran interacciones en esta categoría para la campaña seleccionada.
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left">
              <thead className="sticky top-0 z-10">
                <tr className="border-y border-slate-100 bg-slate-50">
                  {[
                    "Asociado",
                    "Canal",
                    "Estado",
                    "Campos recopilados",
                    "Duración",
                    "Sentimiento",
                    "Hora",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 first:pl-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((i) => (
                  <tr key={i.id} className="transition hover:bg-slate-50/70">
                    <td className="py-3 pr-4 pl-6">
                      <Link href={`/people/${i.personId}`} className="group flex items-center gap-3">
                        <Avatar name={i.personName} size="sm" />
                        <div>
                          <div className="text-[13.5px] font-medium text-slate-900 group-hover:text-indigo-700">
                            {i.personName}
                          </div>
                          <div className="text-[12px] text-slate-400">{i.city}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ChannelBadge channel={i.channel} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${(i.fieldsCollected / Math.max(i.fieldsRequested, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[12.5px] text-slate-600 tabular-nums">
                          {i.fieldsCollected}/{i.fieldsRequested}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600 tabular-nums">{i.duration}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-[12.5px] font-medium",
                          i.sentiment === "Positivo"
                            ? "text-emerald-600"
                            : i.sentiment === "Negativo"
                              ? "text-rose-600"
                              : "text-slate-500",
                        )}
                      >
                        {i.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500 tabular-nums">
                      {formatTime(i.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ALL CAMPAIGNS CARDS LIST */}
      <div className="space-y-3.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-slate-900">Todas las campañas</h3>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                {campaigns.length} disponibles
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Haz clic en <strong className="font-semibold text-indigo-600">Ver en tablero</strong> para cambiar la campaña activa arriba con sus gráficos y demografía, o en <strong className="font-semibold text-violet-700">Demo y detalle</strong> para abrir el modal y realizar llamadas de prueba con IA.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="animate-slide-up">
              <CampaignCard
                campaign={c}
                isActive={c.id === activeCampaignId}
                onSelect={(camp) => setSelectedCampaign(camp)}
                onActivate={(camp) => {
                  handleSwitchCampaign(camp.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <CreateCampaignModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onLaunch={(c) => {
          setCampaigns((prev) => [c, ...prev]);
          handleSwitchCampaign(c.id);
        }}
        audiencePresets={props.audiencePresets}
        collectableFields={props.collectableFields}
        initialAudience={props.initialAudience}
      />

      <CampaignDetailModal
        open={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        campaign={selectedCampaign}
        onCampaignUpdated={() => {
          handleSwitchCampaign(activeCampaignId);
        }}
      />
      {toast.node}
    </div>
  );
}
