import { BookOpen, LayoutDashboard, Megaphone, Scale, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen Ejecutivo", title: "Resumen Ejecutivo", icon: LayoutDashboard },
  { href: "/people", label: "Inteligencia de Personas", title: "Inteligencia de Personas", icon: Users },
  { href: "/campaigns", label: "Campañas con IA", title: "Campañas con IA", icon: Megaphone, badge: "2" },
  { href: "/labor-ai", label: "Inteligencia Laboral AI", title: "NEXA Laboral AI", icon: Scale, ai: true },
  { href: "/knowledge", label: "Centro de Conocimiento", title: "Centro de Conocimiento", icon: BookOpen },
] as const;

export const ORGANIZATION = {
  name: "Financiera Comultrasan",
  plan: "Enterprise · Demo",
  initials: "FC",
  logo: "/brand/comultrasan-logo.png",
};

export const CURRENT_USER = {
  name: "Laura Mantilla",
  role: "Líder de Inteligencia de Asociados",
  email: "laura.mantilla@comultrasan.demo",
};
