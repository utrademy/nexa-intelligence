import { ArrowRight, BrainCircuit, CalendarDays, Download, Megaphone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
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
    <div className="mx-auto max-w-[1440px] space-y-6">
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
            <h2 className="mt-3 text-[30px] leading-tight font-semibold tracking-tight">Buenos días</h2>
            <div className="mt-1 text-lg font-medium text-indigo-200">Financiera Comultrasan</div>
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
                La cobertura creció <span className="font-semibold text-white">9 puntos</span> este año. Las campañas con IA actualizaron{" "}
                <span className="font-semibold text-white">1.204 perfiles</span> este mes, principalmente con información laboral y del hogar.
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
            title="Evolución de la completitud de perfiles"
            subtitle="Caracterización promedio de la población · últimos 12 meses"
            action={
              <ChartLegend
                items={[
                  { name: "Completitud", color: "#6366f1" },
                  { name: "Actualizado por IA", color: "#06b6d4" },
                ]}
              />
            }
          />
          <div className="px-4 pt-4 pb-4">
            <AreaSeriesChart
              data={data.trend}
              xKey="month"
              unit="%"
              height={280}
              series={[
                { key: "completeness", name: "Completitud", color: "#6366f1" },
                { key: "aiUpdated", name: "Actualizado por IA", color: "#06b6d4" },
              ]}
            />
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Hallazgos de IA
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
                  <BrainCircuit className="h-3 w-3" /> EN VIVO
                </span>
              </span>
            }
            subtitle="Generado mediante análisis de datos de la organización"
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
          <CardHeader title="Cobertura de caracterización" subtitle="500.000 asociados" />
          <div className="px-6 pt-2 pb-6">
            <DonutChart data={data.coverage} centerValue="68 %" centerLabel="Cobertura" height={210} />
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
          <CardHeader title="Cobertura por dimensión" subtitle="Dónde falta información en los perfiles" />
          <div className="space-y-3.5 px-6 pt-5 pb-6">
            {data.coverageByDimension.map((d) => (
              <div key={d.dimension}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-700">{d.dimension}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{d.coverage} %</span>
                </div>
                <ProgressBar value={d.coverage} className="h-2" />
              </div>
            ))}
            <div className="mt-2 rounded-xl bg-amber-50/70 p-3 text-[12.5px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/10">
              Las dimensiones de inclusión e información social están por debajo del 50 %. Se recomienda priorizarlas en la próxima campaña con IA.
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Situación laboral" subtitle="Reportada e inferida" />
          <div className="px-6 pt-2 pb-6">
            <DonutChart data={data.employment} centerValue={formatCompact(totalEmployment)} centerLabel="Asociados" height={210} />
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

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Población por edad"
            subtitle="Asociados y caracterización promedio por rango de edad"
            action={<ChartLegend items={[{ name: "Asociados", color: "#6366f1" }]} />}
          />
          <div className="px-4 pt-4 pb-4">
            <BarSeriesChart data={data.age} xKey="range" height={260} series={[{ key: "members", name: "Asociados", color: "#6366f1" }]} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Distribución geográfica"
            subtitle="Asociados por municipio · Santander concentra el 74 %"
            action={<ChartLegend items={[{ name: "Asociados", color: "#8b5cf6" }]} />}
          />
          <div className="px-4 pt-4 pb-4">
            <BarSeriesChart data={data.geo} xKey="region" horizontal height={260} series={[{ key: "members", name: "Asociados", color: "#8b5cf6" }]} />
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Campañas recientes con IA"
          subtitle="Caracterización automatizada mediante llamadas con IA, WhatsApp, SMS y formularios seguros"
          action={
            <Link href="/campaigns" className={buttonClasses("secondary", "sm")}>
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          {data.campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </Card>
    </div>
  );
}
