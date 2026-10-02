"use client";

import { ArrowRight, BookOpen, Database, FileText, HardHat, Plus, Scale, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Endorsement } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { AREA_LABEL } from "@/lib/mock/knowledge";
import type { KnowledgeArea, KnowledgeAreaId, KnowledgeDocument } from "@/lib/types";
import { cn, formatDate } from "@/lib/format";
import { UploadModal } from "./UploadModal";

const AREA_STYLE: Record<KnowledgeAreaId, { icon: typeof Scale; gradient: string; tone: string }> = {
  "labor-law": { icon: Scale, gradient: "from-indigo-500 to-violet-500", tone: "text-indigo-700 bg-indigo-50" },
  "social-security": { icon: ShieldCheck, gradient: "from-cyan-500 to-sky-500", tone: "text-cyan-700 bg-cyan-50" },
  osh: { icon: HardHat, gradient: "from-amber-500 to-orange-500", tone: "text-amber-700 bg-amber-50" },
  "sergio-flores": { icon: BookOpen, gradient: "from-violet-500 to-fuchsia-500", tone: "text-violet-700 bg-violet-50" },
  other: { icon: FileText, gradient: "from-slate-500 to-gray-500", tone: "text-slate-700 bg-slate-50" },
};

const SHORT_LABEL: Record<KnowledgeAreaId, string> = {
  "labor-law": "Laboral",
  "social-security": "Seguridad social",
  osh: "SST",
  "sergio-flores": "Sergio Flórez",
  other: "Otros",
};

export function KnowledgeCenter({
  areas,
  documents: initialDocs,
  realIndexedCount = 0,
}: {
  areas: KnowledgeArea[];
  documents: KnowledgeDocument[];
  realIndexedCount?: number;
}) {
  const toast = useToast();
  const [documents, setDocuments] = useState(initialDocs);
  const [areaFilter, setAreaFilter] = useState<KnowledgeAreaId | "all">("all");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [extraCounts, setExtraCounts] = useState<Partial<Record<KnowledgeAreaId, number>>>({});
  const [currentRealCount, setCurrentRealCount] = useState(realIndexedCount);

  const visible = useMemo(
    () =>
      documents.filter(
        (d) =>
          (areaFilter === "all" || d.area === areaFilter) &&
          (!query ||
            d.title.toLowerCase().includes(query.toLowerCase()) ||
            d.source.toLowerCase().includes(query.toLowerCase()))
      ),
    [documents, areaFilter, query]
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex animate-fade-in flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
            Centro de Conocimiento
          </h2>
          <p className="mt-1 text-[14px] text-slate-500">
            Conocimiento especializado de Sergio Flórez &amp; Abogados integrado con inteligencia artificial y datos organizacionales.
          </p>
          <Endorsement tone="dark" className="mt-1" />
        </div>
        <Button variant="ai" size="lg" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Agregar conocimiento
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-ink-900 p-6 text-white">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="absolute -top-20 left-1/3 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
          <div className="flex flex-1 flex-wrap items-center justify-center gap-3 lg:justify-start">
            <div className="flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-3.5 py-2 text-[13px] font-medium text-indigo-100 shadow-xs backdrop-blur">
              <Sparkles className="h-4 w-4 text-indigo-300" />
              Documentos reales indexados: <b className="font-semibold text-white">{currentRealCount}</b>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[12.5px] whitespace-nowrap text-slate-300 backdrop-blur">
              <FileText className="h-4 w-4 text-indigo-300" />
              Base vectorial pgvector (1536 dimensiones)
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[12.5px] whitespace-nowrap text-slate-300 backdrop-blur">
              <Database className="h-4 w-4 text-emerald-400" />
              Datos organizacionales (600 perfiles)
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="hidden h-px w-10 bg-linear-to-r from-transparent to-indigo-400 lg:block" />
            <ArrowRight className="h-4 w-4 text-indigo-300" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Motor RAG Sergio Flórez &amp; Abogados
          </div>
          <ArrowRight className="h-4 w-4 text-indigo-300" />
          <Link
            href="/labor-ai"
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-900 transition hover:bg-indigo-50"
          >
            <Scale className="h-4 w-4 text-indigo-600" />
            NEXA Laboral AI
          </Link>
        </div>
        <p className="relative mt-4 text-center text-[12.5px] text-slate-300 lg:text-left">
          La experiencia jurídica y metodológica de Sergio Flórez &amp; Abogados integrada con inteligencia artificial y datos organizacionales. Cada respuesta de NEXA Laboral AI se fundamenta en los documentos efectivamente indexados y en los datos autorizados de su organización, con citas precisas a la fuente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {areas.map((a, i) => {
          const style = AREA_STYLE[a.id] || AREA_STYLE["labor-law"];
          const active = areaFilter === a.id;
          const count = a.documents + (extraCounts[a.id] ?? 0);
          return (
            <button
              key={a.id}
              onClick={() => setAreaFilter(active ? "all" : a.id)}
              className={cn(
                "group relative animate-slide-up overflow-hidden rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]",
                active ? "border-indigo-300 ring-4 ring-indigo-500/10" : "border-slate-200/80"
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={cn(
                  "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-br opacity-10 blur-2xl transition group-hover:opacity-20",
                  style.gradient
                )}
              />
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg",
                  style.gradient
                )}
              >
                <style.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-slate-900">{a.name}</div>
              <div className="mt-0.5 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
                {count}{" "}
                <span className="text-[12.5px] font-normal text-slate-400">
                  {count === 1 ? "documento real indexado" : "documentos reales indexados"}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-slate-500">
                {a.description}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="text-slate-400">Disponibilidad RAG</span>
                  <span className="font-semibold text-slate-700">{count > 0 ? "100 %" : "0 %"}</span>
                </div>
                <ProgressBar value={count > 0 ? 100 : 0} barClassName={cn("bg-linear-to-r", style.gradient)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[11.5px] text-slate-400">
                <span className="whitespace-nowrap">
                  {count > 0 ? `Actualizado el ${formatDate(a.lastUpdated)}` : "Sin documentos aún"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 px-6 pt-5 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Documentos indexados</h3>
            <p className="text-[13px] text-slate-500">
              {areaFilter === "all" ? "Todas las áreas de conocimiento" : AREA_LABEL[areaFilter]} ·{" "}
              {visible.length} {visible.length === 1 ? "documento real" : "documentos reales"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {(["all", ...areas.map((a) => a.id)] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => setAreaFilter(id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                    areaFilter === id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {id === "all" ? "Todas" : SHORT_LABEL[id] || id}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar documentos…"
                className="h-9 w-56 rounded-lg border border-slate-200 pr-3 pl-9 text-[13px] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60">
                {["Documento", "Área de conocimiento", "Fuente / Origen", "Última actualización", "Estado IA"].map((h) => (
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
              {visible.map((d) => {
                const style = AREA_STYLE[d.area] || AREA_STYLE["labor-law"];
                return (
                  <tr
                    key={d.id}
                    className="bg-white transition hover:bg-slate-50/70"
                  >
                    <td className="py-3 pr-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                            d.format === "PDF"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-sky-50 text-sky-600"
                          )}
                        >
                          {d.format}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-medium text-slate-900">
                              {d.title}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                              Vectorizado RAG
                            </span>
                          </div>
                          <div className="text-[12px] text-slate-400">
                            {d.pages} páginas · {d.chunkCount || d.pages} fragmentos
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium whitespace-nowrap",
                          style.tone
                        )}
                      >
                        <style.icon className="h-3 w-3" />
                        {AREA_LABEL[d.area] || d.area}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-600">{d.source}</td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap text-slate-500">
                      {formatDate(d.lastUpdated)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="py-16 text-center text-[13px] text-slate-500">
              No hay documentos indexados en esta categoría. Use el botón &quot;Agregar conocimiento&quot; para cargar un documento PDF.
            </div>
          )}
        </div>
      </Card>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        areas={areas}
        onUploaded={(docs) => {
          setDocuments((prev) => [...docs, ...prev]);
          setExtraCounts((prev) => ({
            ...prev,
            [docs[0].area]: (prev[docs[0].area] ?? 0) + docs.length,
          }));
          setCurrentRealCount((c) => c + docs.length);
          setAreaFilter("all");
          toast.show("Documento indexado con éxito en PostgreSQL con pgvector");
        }}
      />
      {toast.node}
    </div>
  );
}
