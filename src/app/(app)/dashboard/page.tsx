import {
  Accessibility,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Download,
  FileSearch,
  HeartPulse,
  Layers,
  Megaphone,
  PhoneCall,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PartnerMark } from "@/components/brand/Logo";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { BarSeriesChart, ChartLegend, DonutChart } from "@/components/charts/Charts";
import { AiInsightCard } from "@/components/dashboard/AiInsightCard";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProgressBar } from "@/components/ui/Progress";
import { getDashboardData } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";
import { IntroVideo } from "@/components/dashboard/IntroVideo";
import { GuidedTourButton } from "@/components/dashboard/GuidedTour";

export const metadata: Metadata = { title: "Resumen Ejecutivo" };

const ACTION_LINKS: Record<string, string> = {
  "Crear campaña de caracterización": "/campaigns",
  "Lanzar campaña": "/campaigns",
  "Optimizar canales": "/campaigns",
  "Explorar segmento": "/people",
  "Ver mapa de asociados": "/people",
  "Completar información con IA": "/campaigns",
  "Revisar perfiles": "/people",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const totalEmployment = data.employment.reduce((s, e) => s + e.value, 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-7">
      {/* 1. HERO SECTION & STRATEGIC POSITIONING */}
      <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-slate-200/70 bg-ink-900 px-7 py-7 text-white lg:px-9">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="absolute -top-28 right-10 h-72 w-72 rounded-full bg-indigo-600/30 blur-[90px]" />
        <div className="absolute -bottom-32 right-64 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[13px] text-slate-400">
              <CalendarDays className="h-4 w-4" />
              Viernes, 2 de octubre de 2026
            </div>
            <div className="mt-4 flex items-center gap-3.5">
              <div className="flex h-11 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white px-2 py-1 shadow-md">
                <Image
                  src="/brand/comultrasan-logo.png"
                  alt="Financiera Comultrasan"
                  width={80}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-[28px] leading-tight font-semibold tracking-tight">Buenos días</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-indigo-200">Financiera Comultrasan</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-[14px] text-slate-400">Panel Ejecutivo de Inteligencia Poblacional</p>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-300">
              NEXA consolida los datos de su organización con modelos de caracterización mediante IA y conocimiento jurídico laboral
              especializado, brindando visibilidad integral y capacidad operativa para la toma de decisiones.
            </p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <PartnerMark
                  size="sm"
                  label={
                    <>
                      <span className="hidden sm:inline">Inteligencia laboral </span>con el respaldo de
                    </>
                  }
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <GuidedTourButton />
                  <IntroVideo variant="dashboard-hero" />
                </div>
              </div>
              <p className="mt-2 text-[12px] text-slate-400">
                Sergio Flórez Abogados aporta el marco analítico, normativo y jurisprudencial para la comprensión del entorno laboral y pensional.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <div className="flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-cyan-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-[13px] leading-relaxed text-slate-300">
                Muestra activa de <span className="font-semibold text-white">{formatNumber(data.totalProfiles)} personas</span> en Supabase.{" "}
                <span className="font-semibold text-white">{data.contactablePercentage}% contactables</span> ({formatNumber(data.contactableProfiles)} personas) y{" "}
                <span className="font-semibold text-white">{formatNumber(data.profilesUpdatedByAI)} perfiles</span> enriquecidos autónomamente con IA.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/people"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 text-[13px] font-medium whitespace-nowrap text-slate-200 transition hover:bg-white/10"
              >
                <Users className="h-4 w-4" />
                Explorar población
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-medium whitespace-nowrap text-slate-900 transition hover:bg-indigo-50"
              >
                <Megaphone className="h-4 w-4" />
                Nueva campaña con IA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL EXECUTIVE KPIS */}
      <section className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[13px] font-semibold tracking-wider text-slate-500 uppercase">Indicadores Clave de Desempeño</h3>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-indigo-500" />
            100% calculados desde Supabase
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {data.kpis.map((kpi, i) => (
            <KpiCard key={kpi.id} kpi={kpi} index={i} />
          ))}
        </div>
      </section>

      {/* 3. AI ACTIONS SHORTCUTS */}
      <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 via-white to-cyan-50/70 p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900">Capacidad Operativa de NEXA AI</h3>
            </div>
            <p className="text-[13px] text-slate-600">
              Transforme los hallazgos en acciones inmediatas conectadas directamente a los módulos activos del sistema:
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-indigo-700 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <Megaphone className="h-3.5 w-3.5 text-indigo-600" />
              Completar info con IA
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <PhoneCall className="h-3.5 w-3.5 text-slate-600" />
              Crear campaña
            </Link>
            <Link
              href="/people"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <Users className="h-3.5 w-3.5 text-slate-600" />
              Explorar personas
            </Link>
            <Link
              href="/labor-ai"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <Scale className="h-3.5 w-3.5 text-slate-600" />
              Inteligencia Laboral
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <FileSearch className="h-3.5 w-3.5 text-slate-600" />
              Fuentes jurídicas
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CHARACTERIZATION INTELLIGENCE & AUTOMATIC FINDINGS */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Distribución de completitud de perfiles"
            subtitle={`Nivel de caracterización en la muestra real POC · ${formatNumber(data.totalProfiles)} perfiles analizados`}
            action={<ChartLegend items={[{ name: "Perfiles", color: "#6366f1" }]} />}
          />
          <div className="px-4 pt-2 pb-4">
            <BarSeriesChart
              data={data.completenessDistribution}
              xKey="bucket"
              unit=" perfiles"
              height={270}
              series={[{ key: "members", name: "Perfiles", color: "#6366f1" }]}
            />
            <div className="mt-2 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3 text-[12.5px]">
              <div className="rounded-lg bg-emerald-50/60 p-2.5 text-emerald-900 border border-emerald-100">
                <span className="font-semibold block">{data.completePercentage}% Completo</span>
                <span className="text-slate-600">{formatNumber(data.completeProfiles)} personas con perfil verificado</span>
              </div>
              <div className="rounded-lg bg-amber-50/60 p-2.5 text-amber-900 border border-amber-100">
                <span className="font-semibold block">{data.pendingPercentage}% Pendiente</span>
                <span className="text-slate-600">{formatNumber(data.pendingProfiles)} personas requieren completar datos</span>
              </div>
              <div className="rounded-lg bg-rose-50/60 p-2.5 text-rose-900 border border-rose-100">
                <span className="font-semibold block">{data.criticalGapsPercentage}% Vacíos Críticos</span>
                <span className="text-slate-600">{formatNumber(data.criticalGapProfiles)} personas prioritarias para campaña</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 5. DETERMINISTIC HALLAZGOS DE INTELIGENCIA */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Hallazgos de Inteligencia
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  <BrainCircuit className="h-3 w-3" /> DATOS REALES
                </span>
              </span>
            }
            subtitle="Patrones detectados automáticamente sobre PostgreSQL"
          />
          <div className="scrollbar-thin max-h-[380px] space-y-2.5 overflow-y-auto px-5 pt-2 pb-5">
            {data.insights.map((ins) => (
              <AiInsightCard
                key={ins.id}
                insight={ins}
                href={ACTION_LINKS[ins.action ?? ""] || "/campaigns"}
              />
            ))}
          </div>
        </Card>
      </section>

      {/* 6. CHARACTERIZATION DEEP-DIVE: COBERTURA Y CAMPOS FALTANTES */}
      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Coverage breakdown */}
        <Card>
          <CardHeader title="Estado de caracterización" subtitle={`${formatNumber(data.totalProfiles)} personas analizadas`} />
          <div className="px-6 pt-2 pb-6">
            <DonutChart data={data.coverage} centerValue={`${data.averageCharacterization} %`} centerLabel="Promedio" height={210} />
            <div className="mt-4 space-y-2.5">
              {data.coverage.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatNumber(c.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <Link
                href="/campaigns"
                className="flex items-center justify-between rounded-xl bg-indigo-50/70 p-3 text-[12.5px] font-medium text-indigo-700 transition hover:bg-indigo-100/60"
              >
                <span>Crear campaña para vacíos críticos ({formatNumber(data.criticalGapProfiles)})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Most commonly missing fields */}
        <Card>
          <CardHeader
            title="Campos con mayor vacío"
            subtitle="Brechas prioritarias a recolectar con IA"
          />
          <div className="space-y-4 px-6 pt-4 pb-6">
            {data.missingFields.map((field) => (
              <div key={field.fieldKey}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-700">{field.fieldLabel}</span>
                  <div className="text-right">
                    <span className="font-semibold text-rose-600 tabular-nums">
                      {field.missingPercentage} % pendiente
                    </span>
                    <span className="ml-1.5 text-[11.5px] text-slate-400">
                      ({formatNumber(field.missingCount)} vacíos)
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={field.availablePercentage}
                  className="h-2"
                  barClassName="bg-linear-to-r from-amber-500 to-emerald-500"
                />
              </div>
            ))}
            <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600">
              <span className="font-medium text-slate-900">Impacto comercial:</span> Conocer ocupación e ingresos permite evaluar capacidad de pago, ofrecer créditos pre-aprobados y perfilar portafolios cooperativos.
            </div>
          </div>
        </Card>

        {/* Coverage by dimension */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Cobertura por dimensión" subtitle="Disponibilidad fáctica de información" />
          <div className="space-y-3.5 px-6 pt-4 pb-6">
            {data.coverageByDimension.map((d) => (
              <div key={d.dimension}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-slate-700">{d.dimension}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {d.note ? (
                      <span className="text-[11px] font-normal text-slate-400">{d.note}</span>
                    ) : (
                      `${d.coverage} %`
                    )}
                  </span>
                </div>
                <ProgressBar value={d.coverage} className="h-1.5" />
              </div>
            ))}
            <div className="mt-3 rounded-xl bg-indigo-50/50 p-3 text-[12px] leading-relaxed text-indigo-900 border border-indigo-100/60">
              Muestra POC: Las dimensiones de contacto, situación laboral y educación cuentan con base sólida para iniciar contacto multicanal.
            </div>
          </div>
        </Card>
      </section>

      {/* 6.1 HIGHLIGHTED INCLUSION & DISABILITY SECTION */}
      <section className="rounded-3xl border border-amber-200/80 bg-linear-to-br from-amber-50/40 via-white to-indigo-50/30 p-6 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Accessibility className="h-4 w-4" />
              </span>
              <h3 className="text-[17px] font-semibold text-slate-900">
                Inteligencia de Inclusión, Incapacidades y Discapacidad
              </h3>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600">
              Diagnóstico fáctico sobre la población respecto a reporte de condiciones de discapacidad, incapacidades laborales permanentes y autorreconocimiento. Esta brecha representa la mayor oportunidad de recolección proactiva mediante NEXA Voice AI.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Megaphone className="h-4 w-4" />
            Lanzar campaña de recolección de discapacidad
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
            <div className="text-[12px] font-medium text-slate-500">Inclusión reportada</div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight text-emerald-600 tabular-nums">
              {data.inclusionStats?.reportedPercentage ?? 38.3} %
            </div>
            <div className="mt-1 text-[12px] text-slate-600">
              {formatNumber(data.inclusionStats?.reportedCount ?? 9106)} asociados con datos validados
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
            <div className="text-[12px] font-medium text-slate-500">Inclusión parcial</div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight text-indigo-600 tabular-nums">
              {data.inclusionStats?.partialPercentage ?? 30.0} %
            </div>
            <div className="mt-1 text-[12px] text-slate-600">
              {formatNumber(data.inclusionStats?.partialCount ?? 7112)} asociados con registro básico
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4.5 shadow-2xs">
            <div className="text-[12px] font-medium text-amber-900">Pendiente / Sin información</div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight text-amber-700 tabular-nums">
              {data.inclusionStats?.pendingPercentage ?? 31.7} %
            </div>
            <div className="mt-1 text-[12px] text-amber-900">
              {formatNumber(data.inclusionStats?.pendingCount ?? 7528)} asociados sin ningún dato registrado
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4.5 shadow-2xs">
            <div className="text-[12px] font-medium text-rose-900">Vacío en condición de discapacidad</div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight text-rose-600 tabular-nums">
              {data.inclusionStats?.disabilityMissingPercentage ?? 99.9} %
            </div>
            <div className="mt-1 text-[12px] text-rose-800">
              {formatNumber(data.inclusionStats?.disabilityMissingCount ?? (data.totalProfiles - 1))} asociados por recolectar
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-white/80 p-3.5 text-[12.5px] text-slate-600 sm:flex-row sm:items-center sm:justify-between border border-amber-200/60">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              <strong>Integración activa en Voice AI:</strong> El asistente telefónico de NEXA formula la pregunta de discapacidad e incapacidad permanente con consentimiento expreso bajo la Ley 1581 y almacena los resultados en PostgreSQL.
            </span>
          </div>
          <Link
            href="/people?inclusion=Pendiente"
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
          >
            Filtrar asociados pendientes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 7. POPULATION INTELLIGENCE: REAL DISTRIBUTIONS */}
      <section className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[13px] font-semibold tracking-wider text-slate-500 uppercase">Inteligencia Poblacional</h3>
          <span className="text-[12px] text-slate-400">Segmentación fáctica de asociados en base de datos</span>
        </div>

        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-2">
          {/* Situation laboral */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader
              title="Situación laboral"
              subtitle="Distribución ocupacional en la muestra POC"
              action={<ChartLegend items={[{ name: "Perfiles", color: "#6366f1" }]} />}
            />
            <div className="px-6 pt-2 pb-6">
              <DonutChart data={data.employment} centerValue={formatCompact(totalEmployment)} centerLabel="Perfiles" height={210} />
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {data.employment.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2 truncate text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: e.color }} />
                      <span className="truncate">{e.name}</span>
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">{Math.round((e.value / totalEmployment) * 100)} %</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Education level */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader
              title="Nivel educativo"
              subtitle={`Distribución de grado de instrucción · ${formatNumber(data.totalProfiles)} perfiles`}
              action={<ChartLegend items={[{ name: "Asociados", color: "#06b6d4" }]} />}
            />
            <div className="min-w-0 px-2 pt-2 pb-4 sm:px-4">
              <BarSeriesChart
                data={data.education}
                xKey="name"
                unit=" asociados"
                height={260}
                series={[{ key: "value", name: "Asociados", color: "#06b6d4" }]}
              />
            </div>
          </Card>
        </div>

        <div className="grid w-full min-w-0 gap-6 lg:grid-cols-2">
          {/* Age range */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader
              title="Población por rango de edad"
              subtitle={`Distribución etaria · Muestra POC de ${formatNumber(data.totalProfiles)} perfiles`}
              action={<ChartLegend items={[{ name: "Asociados", color: "#6366f1" }]} />}
            />
            <div className="min-w-0 px-2 pt-2 pb-4 sm:px-4">
              <BarSeriesChart data={data.age} xKey="range" height={260} series={[{ key: "members", name: "Asociados", color: "#6366f1" }]} />
            </div>
          </Card>

          {/* Geographic concentration */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader
              title="Concentración geográfica"
              subtitle={`Municipios principales · Santander concentra el ${data.santanderPercentage} % de la población`}
              action={<ChartLegend items={[{ name: "Asociados", color: "#8b5cf6" }]} />}
            />
            <div className="min-w-0 px-2 pt-2 pb-4 sm:px-4">
              <BarSeriesChart data={data.geo} xKey="region" horizontal height={260} series={[{ key: "members", name: "Asociados", color: "#8b5cf6" }]} />
            </div>
          </Card>
        </div>
      </section>

      {/* 8. ACTIVE CAMPAIGNS CONNECTED TO DB */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader
          title="Campañas con IA en ejecución"
          subtitle="Campañas activas en Supabase para enriquecimiento y recolección poblacional"
          action={
            <Link href="/campaigns" className={buttonClasses("secondary", "sm")}>
              Ver todas en módulo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid w-full min-w-0 gap-4 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
          {data.campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </Card>
    </div>
  );
}
