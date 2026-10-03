import { ArrowRight, BrainCircuit, CalendarDays, Download, Megaphone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PartnerMark } from "@/components/brand/Logo";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { AreaSeriesChart, BarSeriesChart, ChartLegend, DonutChart } from "@/components/charts/Charts";
import { AiInsightCard } from "@/components/dashboard/AiInsightCard";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ProgressBar } from "@/components/ui/Progress";
import { getDashboardData } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Resumen Ejecutivo" };

const CAMPAIGN_ACTIONS = new Set(["Lanzar campaña", "Optimizar canales"]);

export default async function DashboardPage() {
  const data = await getDashboardData();
  const totalEmployment = data.employment.reduce((s, e) => s + e.value, 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6">
      <section className="relative animate-fade-in overflow-hidden rounded-3xl border border-slate-200/70 bg-ink-900 px-7 py-7 text-white lg:px-9">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="absolute -top-28 right-10 h-72 w-72 rounded-full bg-indigo-600/30 blur-[90px]" />
        <div className="absolute -bottom-32 right-64 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
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
                  <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10.5px] font-medium text-indigo-100">
                    Entorno POC · datos sintéticos
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-[14px] text-slate-400">Inteligencia integral de su población</p>
            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-300">
              NEXA transforma los datos de su organización en conocimiento para comprender, caracterizar y tomar mejores decisiones sobre su población.
            </p>
            <PartnerMark
              size="sm"
              label={
                <>
                  <span className="hidden sm:inline">Inteligencia laboral </span>con el respaldo de
                </>
              }
              className="mt-6 border-t border-white/10 pt-5"
            />
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <div className="flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-cyan-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-[13px] leading-relaxed text-slate-300">
                Muestra analizada de <span className="font-semibold text-white">{formatNumber(data.totalProfiles)} perfiles</span> en Supabase.{" "}
                <span className="font-semibold text-white">{formatNumber(data.profilesUpdatedByAI)} perfiles</span> enriquecidos con IA y{" "}
                <span className="font-semibold text-white">{formatNumber(data.contactableProfiles)} personas contactables</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 text-[13px] font-medium whitespace-nowrap text-slate-200 transition hover:bg-white/10">
                <Download className="h-4 w-4" />
                Exportar informe
              </button>
              <Link href="/campaigns" className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-medium whitespace-nowrap text-slate-900 transition hover:bg-indigo-50">
                <Megaphone className="h-4 w-4" />
                Nueva campaña con IA
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {data.kpis.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} index={i} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Distribución de completitud de perfiles"
            subtitle={`Nivel de caracterización en la muestra real POC · ${formatNumber(data.totalProfiles)} perfiles`}
            action={
              <ChartLegend
                items={[
                  { name: "Perfiles", color: "#6366f1" },
                ]}
              />
            }
          />
          <div className="px-4 pt-4 pb-4">
            <BarSeriesChart
              data={data.completenessDistribution}
              xKey="bucket"
              unit=" perfiles"
              height={280}
              series={[
                { key: "members", name: "Perfiles", color: "#6366f1" },
              ]}
            />
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Hallazgos Analíticos
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  <BrainCircuit className="h-3 w-3" /> DATOS REALES
                </span>
              </span>
            }
            subtitle="Generado a partir de datos reales de la muestra POC"
          />
          <div className="scrollbar-thin max-h-[330px] space-y-2.5 overflow-y-auto px-5 pt-4 pb-5">
            {data.insights.map((ins) => (
              <AiInsightCard key={ins.id} insight={ins} href={CAMPAIGN_ACTIONS.has(ins.action ?? "") ? "/campaigns" : "/people"} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Cobertura de caracterización" subtitle={`${formatNumber(data.totalProfiles)} perfiles analizados`} />
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
          </div>
        </Card>

        <Card>
          <CardHeader title="Cobertura por dimensión" subtitle="Disponibilidad fáctica de información en la muestra" />
          <div className="space-y-3.5 px-6 pt-5 pb-6">
            {data.coverageByDimension.map((d) => (
              <div key={d.dimension}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-700">{d.dimension}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {d.note ? (
                      <span className="text-[11px] font-normal text-slate-400">{d.note}</span>
                    ) : (
                      `${d.coverage} %`
                    )}
                  </span>
                </div>
                <ProgressBar value={d.coverage} className="h-2" />
              </div>
            ))}
            <div className="mt-2 rounded-xl bg-amber-50/70 p-3 text-[12.5px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/10">
              Muestra real POC: Las dimensiones de datos personales, información laboral y educación cuentan con amplia cobertura fáctica.
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Situación laboral" subtitle="Calculada directamente desde PostgreSQL" />
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
      </section>

      <section className="grid w-full min-w-0 gap-6 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader
            title="Población por edad"
            subtitle={`Asociados por rango de edad · Muestra POC de ${formatNumber(data.totalProfiles)} perfiles`}
            action={<ChartLegend items={[{ name: "Asociados", color: "#6366f1" }]} />}
          />
          <div className="min-w-0 px-2 pt-4 pb-4 sm:px-4">
            <BarSeriesChart data={data.age} xKey="range" height={260} series={[{ key: "members", name: "Asociados", color: "#6366f1" }]} />
          </div>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader
            title="Distribución geográfica"
            subtitle={`Asociados por municipio · Santander concentra el ${data.santanderPercentage} % de la muestra`}
            action={<ChartLegend items={[{ name: "Asociados", color: "#8b5cf6" }]} />}
          />
          <div className="min-w-0 px-2 pt-4 pb-4 sm:px-4">
            <BarSeriesChart data={data.geo} xKey="region" horizontal height={260} series={[{ key: "members", name: "Asociados", color: "#8b5cf6" }]} />
          </div>
        </Card>
      </section>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader
          title="Campañas con IA"
          subtitle="Escenario demostrativo · Simulación de metas sobre población POC"
          action={
            <Link href="/campaigns" className={buttonClasses("secondary", "sm")}>
              Ver todas
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
