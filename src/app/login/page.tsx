import type { Metadata } from "next";
import { LoginView } from "@/components/login/LoginView";

export const metadata: Metadata = {
  title: "Acceso Seguro",
  description:
    "Portal de acceso seguro a NEXA Intelligence. Plataforma de inteligencia poblacional y laboral con el respaldo de Sergio Flórez Abogados.",
  openGraph: {
    title: "NEXA Intelligence · Acceso a la Plataforma",
    description:
      "Acceso institucional a la plataforma de caracterización poblacional con IA. Respaldo jurídico de Sergio Flórez Abogados.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function LoginPage() {
  return <LoginView />;
}
