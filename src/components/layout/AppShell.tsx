"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[264px] animate-slide-up">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 max-w-full px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
