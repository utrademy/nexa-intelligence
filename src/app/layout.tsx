import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nexa-intelligence-neon.vercel.app"),
  title: {
    default: "NEXA Intelligence · Plataforma de Inteligencia Laboral y Poblacional",
    template: "%s · NEXA Intelligence",
  },
  description:
    "Plataforma de inteligencia poblacional y caracterización con IA, respaldada por Sergio Flórez Abogados. Transforme los datos de su organización en decisiones estratégicas.",
  keywords: [
    "NEXA Intelligence",
    "Sergio Flórez Abogados",
    "Inteligencia Laboral",
    "Caracterización Poblacional",
    "Inteligencia Artificial",
    "Derecho Laboral Colombiano",
    "Financiera Comultrasan",
  ],
  authors: [{ name: "Sergio Flórez Abogados" }],
  creator: "Sergio Flórez Abogados",
  publisher: "NEXA Intelligence",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://nexa-intelligence-neon.vercel.app",
    siteName: "NEXA Intelligence",
    title: "NEXA Intelligence · Plataforma de Inteligencia Laboral y Poblacional",
    description:
      "Caracterización de población con modelos de IA y marco jurídico especializado de Sergio Flórez Abogados. Entorno activo para Financiera Comultrasan.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NEXA Intelligence · Sergio Flórez Abogados",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXA Intelligence · Sergio Flórez Abogados",
    description:
      "Plataforma de inteligencia poblacional y caracterización con IA con respaldo jurídico de Sergio Flórez Abogados.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
