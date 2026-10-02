import type { AiInsight, Kpi } from "@/lib/types";

export const DASHBOARD_KPIS: Kpi[] = [
  { id: "members", label: "Asociados", value: "500.000", delta: "+2,4 %", trend: "up", hint: "vs. trimestre anterior", icon: "users", tone: "indigo" },
  { id: "contactable", label: "Asociados contactables", value: "386.240", delta: "77,2 %", trend: "flat", hint: "de la población total", icon: "phone", tone: "cyan" },
  { id: "coverage", label: "Cobertura de caracterización", value: "68 %", delta: "+9 p.p.", trend: "up", hint: "desde enero", icon: "gauge", tone: "violet" },
  { id: "missing", label: "Perfiles con información crítica pendiente", value: "42.841", delta: "−6,1 %", trend: "down", hint: "vs. mes anterior", icon: "alert", tone: "amber" },
  { id: "interactions", label: "Interacciones gestionadas por IA", value: "18.430", delta: "+31 %", trend: "up", hint: "últimos 30 días", icon: "sparkles", tone: "indigo" },
  { id: "updated", label: "Perfiles actualizados por IA", value: "8.421", delta: "+1.204", trend: "up", hint: "este mes", icon: "refresh", tone: "emerald" },
];

export const COVERAGE_BREAKDOWN = [
  { name: "Caracterización completa", value: 218_400, color: "#6366f1" },
  { name: "Caracterización parcial", value: 238_759, color: "#a5b4fc" },
  { name: "Vacíos críticos", value: 42_841, color: "#f59e0b" },
];

export const COVERAGE_BY_DIMENSION = [
  { dimension: "Datos personales", coverage: 94 },
  { dimension: "Información financiera", coverage: 88 },
  { dimension: "Hogar", coverage: 66 },
  { dimension: "Educación", coverage: 61 },
  { dimension: "Información laboral", coverage: 57 },
  { dimension: "Información social", coverage: 49 },
  { dimension: "Inclusión", coverage: 34 },
];

export const AGE_DISTRIBUTION = [
  { range: "18–24", members: 46_200, characterized: 52 },
  { range: "25–34", members: 112_800, characterized: 61 },
  { range: "35–44", members: 121_500, characterized: 66 },
  { range: "45–54", members: 94_300, characterized: 74 },
  { range: "55–64", members: 72_100, characterized: 79 },
  { range: "65+", members: 53_100, characterized: 71 },
];

export const GEO_DISTRIBUTION = [
  { region: "Bucaramanga", members: 148_200, gaps: 31 },
  { region: "Floridablanca", members: 69_400, gaps: 28 },
  { region: "Girón", members: 41_300, gaps: 36 },
  { region: "Piedecuesta", members: 39_800, gaps: 33 },
  { region: "Barrancabermeja", members: 31_600, gaps: 42 },
  { region: "Bogotá", members: 48_900, gaps: 24 },
  { region: "Cúcuta", members: 29_700, gaps: 38 },
  { region: "Otros municipios", members: 91_100, gaps: 35 },
];

export const EMPLOYMENT_DISTRIBUTION = [
  { name: "Empleado", value: 189_000, color: "#6366f1" },
  { name: "Independiente", value: 101_000, color: "#8b5cf6" },
  { name: "Informal", value: 54_500, color: "#06b6d4" },
  { name: "Pensionado", value: 45_200, color: "#10b981" },
  { name: "Desempleado / Estudiante", value: 54_100, color: "#94a3b8" },
  { name: "Sin información", value: 56_200, color: "#f59e0b" },
];

export const COMPLETENESS_TREND = [
  { month: "Nov", completeness: 51, aiUpdated: 0 },
  { month: "Dic", completeness: 52, aiUpdated: 0 },
  { month: "Ene", completeness: 53, aiUpdated: 0.2 },
  { month: "Feb", completeness: 54, aiUpdated: 0.6 },
  { month: "Mar", completeness: 55, aiUpdated: 1.1 },
  { month: "Abr", completeness: 57, aiUpdated: 1.9 },
  { month: "May", completeness: 59, aiUpdated: 2.8 },
  { month: "Jun", completeness: 61, aiUpdated: 3.9 },
  { month: "Jul", completeness: 63, aiUpdated: 5.0 },
  { month: "Ago", completeness: 65, aiUpdated: 6.2 },
  { month: "Sep", completeness: 67, aiUpdated: 7.4 },
  { month: "Oct", completeness: 68, aiUpdated: 8.4 },
];

export const AI_INSIGHTS: AiInsight[] = [
  {
    id: "ins-1",
    title: "Vacíos de información críticos",
    description: "42.841 perfiles presentan vacíos de información relevantes para procesos de segmentación y caracterización.",
    severity: "critical",
    metric: "42.841",
    action: "Revisar perfiles",
  },
  {
    id: "ins-2",
    title: "Mayor oportunidad de actualización",
    description: "El grupo entre 25 y 45 años concentra la mayor oportunidad de actualización de información: 234.300 asociados con una cobertura promedio del 63 %.",
    severity: "opportunity",
    metric: "234 mil",
    action: "Crear segmento",
  },
  {
    id: "ins-3",
    title: "Concentración de información laboral pendiente",
    description: "Santander presenta la mayor concentración de perfiles que requieren actualización de información laboral, especialmente en Barrancabermeja y Girón.",
    severity: "opportunity",
    metric: "61 %",
    action: "Lanzar campaña",
  },
  {
    id: "ins-4",
    title: "WhatsApp supera a los demás canales",
    description: "En asociados menores de 40 años, las campañas por WhatsApp completan 1,4 veces más perfiles que las llamadas. Se recomienda priorizar este canal.",
    severity: "info",
    metric: "1,4×",
    action: "Optimizar canales",
  },
];
