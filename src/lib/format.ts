export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Colombian grouping (500.000) without relying on runtime ICU data. */
export function formatNumber(n: number) {
  const sign = n < 0 ? "-" : "";
  const [int, dec] = Math.abs(n).toString().split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped}${dec ? `,${dec}` : ""}`;
}

export const formatPercent = (n: number) => `${n} %`;

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(".", ",").replace(",0", "")} mil`;
  return `${n}`;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatTime(iso: string) {
  return iso.slice(11, 16) || "";
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function relativeDays(iso: string, reference = "2026-10-02") {
  const days = Math.round(
    (Date.parse(`${reference}T00:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)) / 86_400_000,
  );
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.round(days / 30);
  return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
}

export function initials(name: string) {
  const parts = name.split(" ");
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export const CHANNEL_LABEL = {
  voice: "Llamada con IA",
  whatsapp: "WhatsApp",
  sms: "SMS",
  form: "Formulario seguro",
  branch: "Oficina",
  app: "App móvil",
} as const;
