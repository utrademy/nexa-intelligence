"use client";

import { ChevronLeft, ChevronRight, Download, Layers, Megaphone, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EMPTY_FILTERS, FILTER_LABELS, filterPeople, type PeopleFilters } from "@/lib/people-filters";
import type { Person } from "@/lib/types";
import { cn, formatNumber } from "@/lib/format";
import { PeopleTable } from "./PeopleTable";
import { PopulationQuery } from "./PopulationQuery";

const PAGE_SIZE = 12;

type FilterOptions = Record<keyof PeopleFilters, readonly string[]>;

export function PeopleExplorer({ people, total, filterOptions }: { people: Person[]; total: number; filterOptions: FilterOptions }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<PeopleFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");

  const filtered = useMemo(() => filterPeople(people, query, filters), [people, query, filters]);
  const activeFilters = (Object.keys(filters) as (keyof PeopleFilters)[]).filter((k) => filters[k]);
  const isFiltered = activeFilters.length > 0 || query.trim() !== "";
  const estimated = isFiltered ? Math.round((filtered.length / people.length) * total) : total;
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.characterization, 0) / filtered.length) : 0;
  const gapShare = filtered.length ? filtered.filter((p) => p.profileStatus === "Vacíos críticos").length / filtered.length : 0;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setFilter = (key: keyof PeopleFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setPage(1);
  };

  const stats = [
    { label: isFiltered ? "Asociados que coinciden" : "Total de asociados", value: formatNumber(estimated), accent: true },
    { label: "Caracterización promedio", value: `${avgScore} %` },
    { label: "Con vacíos críticos", value: formatNumber(Math.round(estimated * gapShare)) },
    { label: "Contactables", value: formatNumber(Math.round(estimated * 0.772)) },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="flex animate-fade-in flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">Inteligencia de Personas</h2>
          <p className="mt-1 text-[14px] text-slate-500">Explore, filtre y comprenda su universo de asociados, clientes o empleados.</p>
          <p className="mt-0.5 text-[13px] text-slate-400">
            <span className="font-semibold text-slate-600">{formatNumber(total)}</span> asociados · Financiera Comultrasan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.show("Exportación en cola: recibirá un enlace seguro por correo electrónico")}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="secondary" onClick={() => setSegmentOpen(true)}>
            <Layers className="h-4 w-4" />
            Crear segmento
          </Button>
          <Button variant="ai" onClick={() => router.push(`/campaigns?create=1&audience=${estimated}`)}>
            <Megaphone className="h-4 w-4" />
            Iniciar campaña con IA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-2xl border px-5 py-4 transition",
              s.accent ? "border-indigo-200/70 bg-linear-to-br from-indigo-50 to-white" : "border-slate-200/80 bg-white",
            )}
          >
            <div className="text-[12px] font-medium text-slate-500">{s.label}</div>
            <div className={cn("mt-1 text-[24px] font-semibold tracking-tight tabular-nums", s.accent ? "text-indigo-700" : "text-slate-900")}>{s.value}</div>
          </div>
        ))}
      </div>

      <PopulationQuery people={people} total={total} cities={filterOptions.location} />

      <Card className="overflow-hidden">
        <div className="space-y-4 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, cédula o municipio…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-3 pl-10 text-[13.5px] text-slate-800 placeholder:text-slate-400 transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-[12.5px] whitespace-nowrap text-slate-500">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Pruebe: <button className="font-medium text-indigo-600 hover:underline" onClick={() => setFilter("profileStatus", "Vacíos críticos")}>vacíos críticos</button>·
              <button className="font-medium text-indigo-600 hover:underline" onClick={() => setFilter("age", "25–34")}>25 a 34 años</button>·
              <button className="font-medium text-indigo-600 hover:underline" onClick={() => setFilter("employment", "Sin información")}>sin información laboral</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </span>
            {(Object.keys(FILTER_LABELS) as (keyof PeopleFilters)[]).map((key) => (
              <FilterSelect key={key} label={FILTER_LABELS[key]} value={filters[key]} options={filterOptions[key]} onChange={(v) => setFilter(key, v)} />
            ))}
          </div>

          {isFiltered && (
            <div className="flex animate-fade-in flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <span className="text-[12.5px] text-slate-500">
                <span className="font-semibold text-slate-900">{formatNumber(estimated)}</span> asociados coinciden
              </span>
              <span className="text-slate-300">|</span>
              {query && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] text-slate-700 ring-1 ring-slate-200">
                  “{query}”
                  <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              )}
              {activeFilters.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12px] text-slate-700 ring-1 ring-slate-200">
                  <span className="text-slate-400">{FILTER_LABELS[k]}:</span> {filters[k]}
                  <button onClick={() => setFilter(k, "")} aria-label={`Quitar ${FILTER_LABELS[k]}`}>
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
                  </button>
                </span>
              ))}
              <button onClick={reset} className="ml-auto text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700">
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        <PeopleTable people={visible} onReset={reset} />

        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 sm:flex-row">
            <div className="text-[12.5px] text-slate-500">
              Mostrando <span className="font-medium text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> de{" "}
              <span className="font-medium text-slate-700">{formatNumber(filtered.length)}</span> registros cargados ·{" "}
              <span className="font-medium text-slate-700">{formatNumber(estimated)}</span> en la población
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center">
                    {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                    <button
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 min-w-8 rounded-lg px-2 text-[13px] font-medium tabular-nums transition",
                        n === currentPage ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={segmentOpen}
        onClose={() => setSegmentOpen(false)}
        title="Crear segmento"
        subtitle="Guarde los filtros actuales como un segmento dinámico que se actualiza automáticamente."
        icon={<Layers className="h-5 w-5" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSegmentOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setSegmentOpen(false);
                toast.show(`Segmento “${segmentName || "Segmento sin nombre"}” creado · ${formatNumber(estimated)} asociados`);
                setSegmentName("");
              }}
            >
              Crear segmento
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <label className="block">
            <span className="text-[13px] font-medium text-slate-700">Nombre del segmento</span>
            <input
              autoFocus
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="Ej: Santander — vacíos de información laboral"
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[14px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
            />
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Definición del segmento</div>
            {activeFilters.length === 0 && !query ? (
              <p className="mt-2 text-[13px] text-slate-600">Todos los asociados (sin filtros aplicados).</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {query && <span className="rounded-md bg-white px-2 py-1 text-[12px] ring-1 ring-slate-200">Búsqueda: “{query}”</span>}
                {activeFilters.map((k) => (
                  <span key={k} className="rounded-md bg-white px-2 py-1 text-[12px] ring-1 ring-slate-200">
                    {FILTER_LABELS[k]}: {filters[k]}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-[12px] text-slate-500">Tamaño estimado</div>
                <div className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{formatNumber(estimated)}</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-slate-500">Caracterización promedio</div>
                <div className="text-2xl font-semibold tracking-tight text-indigo-600 tabular-nums">{avgScore} %</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {toast.node}
    </div>
  );
}
