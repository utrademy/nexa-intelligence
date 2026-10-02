import type { KnowledgeArea, KnowledgeAreaId, KnowledgeDocument } from "@/lib/types";

export const ENDORSEMENT = "Sergio Flórez Abogados";

export const KNOWLEDGE_AREAS: KnowledgeArea[] = [
  {
    id: "labor-law",
    name: "Legislación Laboral Colombiana",
    description: "Código Sustantivo del Trabajo, reforma laboral, jurisprudencia y lineamientos del Ministerio del Trabajo.",
    documents: 245,
    lastUpdated: "2026-09-29",
    coverage: 96,
  },
  {
    id: "social-security",
    name: "Seguridad Social",
    description: "Normatividad en salud, pensiones, riesgos laborales (ARL) y cajas de compensación familiar.",
    documents: 128,
    lastUpdated: "2026-09-24",
    coverage: 91,
  },
  {
    id: "osh",
    name: "Seguridad y Salud en el Trabajo",
    description: "SG-SST, Decreto 1072 de 2015, Resolución 0312 de 2019 y guías sectoriales.",
    documents: 82,
    lastUpdated: "2026-09-18",
    coverage: 88,
  },
  {
    id: "sergio-flores",
    name: `Conocimiento ${ENDORSEMENT}`,
    description: `Metodología, conceptos, guías, modelos y conocimiento especializado aprobado por ${ENDORSEMENT}.`,
    documents: 37,
    lastUpdated: "2026-09-30",
    coverage: 100,
  },
];

export const AREA_LABEL: Record<KnowledgeAreaId | "population", string> = {
  "labor-law": "Legislación Laboral Colombiana",
  "social-security": "Seguridad Social",
  osh: "Seguridad y Salud en el Trabajo",
  "sergio-flores": `Conocimiento ${ENDORSEMENT}`,
  population: "Datos de la organización",
};

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  { id: "kd-1", title: "Código Sustantivo del Trabajo — Compilación actualizada 2026", area: "labor-law", source: "Ministerio del Trabajo", format: "PDF", pages: 412, lastUpdated: "2026-09-29", status: "Indexado" },
  { id: "kd-2", title: "Ley 2466 de 2025 — Reforma Laboral", area: "labor-law", source: "Diario Oficial", format: "PDF", pages: 86, lastUpdated: "2026-09-12", status: "Indexado" },
  { id: "kd-3", title: "Ley 1618 de 2013 — Derechos de las personas con discapacidad", area: "labor-law", source: "Congreso de la República", format: "PDF", pages: 34, lastUpdated: "2026-08-30", status: "Indexado" },
  { id: "kd-4", title: "Ley 361 de 1997 — Estabilidad laboral reforzada", area: "labor-law", source: "Congreso de la República", format: "PDF", pages: 22, lastUpdated: "2026-08-30", status: "Indexado" },
  { id: "kd-5", title: "Ley 2101 de 2021 — Reducción de la jornada laboral", area: "labor-law", source: "Congreso de la República", format: "PDF", pages: 9, lastUpdated: "2026-07-15", status: "Indexado" },
  { id: "kd-6", title: "Corte Constitucional — Línea jurisprudencial sobre estabilidad reforzada", area: "labor-law", source: "Relatoría Corte Constitucional", format: "DOCX", pages: 58, lastUpdated: "2026-09-30", status: "Procesando" },
  { id: "kd-7", title: "Ley 100 de 1993 — Sistema de Seguridad Social Integral", area: "social-security", source: "Congreso de la República", format: "PDF", pages: 148, lastUpdated: "2026-09-24", status: "Indexado" },
  { id: "kd-8", title: "Guía PILA — Aportes a seguridad social 2026", area: "social-security", source: "Ministerio de Salud", format: "PDF", pages: 41, lastUpdated: "2026-09-02", status: "Indexado" },
  { id: "kd-9", title: "Circular ARL — Afiliación de trabajadores independientes", area: "social-security", source: "Fasecolda", format: "PDF", pages: 12, lastUpdated: "2026-09-21", status: "Requiere revisión" },
  { id: "kd-10", title: "Decreto 1072 de 2015 — Decreto Único Reglamentario del Sector Trabajo", area: "osh", source: "Ministerio del Trabajo", format: "PDF", pages: 318, lastUpdated: "2026-09-18", status: "Indexado" },
  { id: "kd-11", title: "Resolución 0312 de 2019 — Estándares mínimos del SG-SST", area: "osh", source: "Ministerio del Trabajo", format: "PDF", pages: 64, lastUpdated: "2026-09-18", status: "Indexado" },
  { id: "kd-12", title: "Protocolo de ajustes razonables en el puesto de trabajo", area: "osh", source: "Interno — Equipo SST", format: "DOCX", pages: 18, lastUpdated: "2026-09-27", status: "Requiere revisión" },
  { id: "kd-13", title: "Metodología de inclusión laboral efectiva", area: "sergio-flores", source: ENDORSEMENT, format: "PDF", pages: 72, lastUpdated: "2026-09-30", status: "Indexado" },
  { id: "kd-14", title: "Guía de diagnóstico organizacional de inclusión", area: "sergio-flores", source: ENDORSEMENT, format: "DOCX", pages: 26, lastUpdated: "2026-09-26", status: "Indexado" },
  { id: "kd-15", title: "Lista de verificación de cumplimiento laboral para cooperativas", area: "sergio-flores", source: ENDORSEMENT, format: "PDF", pages: 14, lastUpdated: "2026-09-20", status: "Indexado" },
  { id: "kd-16", title: "Política interna de diversidad e inclusión — Borrador v3", area: "sergio-flores", source: "Financiera Comultrasan — Talento Humano", format: "DOCX", pages: 11, lastUpdated: "2026-10-01", status: "Procesando" },
];
