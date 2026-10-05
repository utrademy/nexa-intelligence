"use client";

import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Endorsement, Logo, LogoMark, PartnerMark } from "@/components/brand/Logo";
import { ClientsCarousel } from "@/components/brand/ClientsCarousel";
import { CURRENT_USER } from "@/components/layout/nav";
import { IntroVideo } from "@/components/dashboard/IntroVideo";

const HIGHLIGHTS = [
  { value: "23,7 mil", label: "Asociados en base de datos" },
  { value: "68 %", label: "Cobertura de perfiles" },
  { value: "95,8 %", label: "Contactabilidad validada" },
];

export function LoginView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="relative hidden w-[52%] overflow-hidden bg-ink-950 lg:flex lg:flex-col">
          <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-violet-600/20 blur-[100px]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
            <Logo endorsed showIntelligence={false} />

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-indigo-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Inteligencia poblacional · Inteligencia laboral colombiana
            </div>
            <h1 className="mt-6 text-[44px] leading-[1.08] font-semibold tracking-tight text-white">
              Conozca su gente.
              <br />
              <span className="text-gradient-ai">Entienda sus datos.</span>
              <br />
              Actúe con inteligencia.
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-400">
              Transforme los datos de su organización en conocimiento accionable. Caracterice su población, complete información con IA y acceda a
              inteligencia especializada en derecho laboral colombiano.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {HIGHLIGHTS.map((h) => (
                <div key={h.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur">
                  <div className="text-2xl font-semibold tracking-tight text-white">{h.value}</div>
                  <div className="mt-1 text-[12px] leading-snug text-slate-400">{h.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <PartnerMark label="Inteligencia laboral con el respaldo de" />
              <div>
                <IntroVideo variant="login-badge" />
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.06] pt-5 text-[12px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400/80" />
              Alineado con la Ley 1581 de 2012 · Recolección de datos con autorización previa
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6 py-12">
        <div className="w-full max-w-[400px] animate-slide-up">
          <div className="mb-10 lg:hidden">
            <Logo tone="dark" endorsed showIntelligence={false} />
          </div>

          <div className="hidden lg:block">
            <LogoMark className="h-11 w-11" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Bienvenido a NEXA</h2>
          <Endorsement tone="dark" className="mt-1 hidden lg:block" />
          <p className="mt-3 text-[14px] text-slate-500">Conozca su gente. Entienda sus datos. Actúe con inteligencia.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => router.push("/dashboard"), 650);
            }}
          >
            <label className="block">
              <span className="text-[13px] font-medium text-slate-700">Correo electrónico</span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  defaultValue={CURRENT_USER.email}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[14px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-slate-700">Contraseña</span>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  defaultValue="demo-password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-[14px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                />
              </div>
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[14px] font-medium text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:opacity-80"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Iniciando sesión…
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <label className="flex items-center justify-center gap-2 pt-1 text-[13px] text-slate-600">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
              Mantener la sesión iniciada
            </label>
          </form>

          <div className="mt-6 flex items-center gap-3 text-[12px] text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            o
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[14px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            Continuar con SSO corporativo
          </button>

          <div className="mt-5">
            <IntroVideo variant="login-card" />
          </div>

          <div className="mt-8 flex justify-center border-t border-slate-200/80 pt-6">
            <PartnerMark tone="dark" label="Inteligencia laboral con el respaldo de" className="items-center" />
          </div>
        </div>
      </div>
    </div>

    {/* SECCIÓN FINAL: CARRUSEL DE POTENCIALES CLIENTES TODO EN FONDO BLANCO */}
    <section className="relative shrink-0 border-t border-slate-200/60 bg-white py-6 px-4 sm:px-8">
      <ClientsCarousel variant="login" />
    </section>
  </div>
  );
}
