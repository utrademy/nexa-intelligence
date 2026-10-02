"use client";

import { ChevronRight, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { ChannelIcon } from "@/components/ui/ChannelBadge";
import { ScoreCell } from "@/components/ui/Progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Person } from "@/lib/types";
import { relativeDays } from "@/lib/format";

const COLUMNS = ["Asociado", "Cédula", "Municipio", "Edad", "Situación laboral", "Caracterización", "Estado del perfil", "Última interacción", ""];

export function PeopleTable({ people, onReset }: { people: Person[]; onReset: () => void }) {
  const router = useRouter();

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <SearchX className="h-6 w-6" />
        </div>
        <div className="mt-4 text-[15px] font-semibold text-slate-900">Ningún asociado coincide con estos criterios</div>
        <p className="mt-1 max-w-sm text-[13px] text-slate-500">Amplíe los filtros o la búsqueda. NEXA busca por nombre, cédula y municipio.</p>
        <button onClick={onReset} className="mt-4 text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
          Limpiar todos los filtros
        </button>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/60">
            {COLUMNS.map((c) => (
              <th key={c} className="px-4 py-2.5 whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 first:pl-6">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {people.map((p) => (
            <tr
              key={p.id}
              onClick={() => router.push(`/people/${p.id}`)}
              className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
            >
              <td className="py-3 pr-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar name={p.fullName} size="sm" />
                  <div>
                    <div className="text-[13.5px] font-medium whitespace-nowrap text-slate-900 group-hover:text-indigo-700">{p.fullName}</div>
                    <div className="text-[12px] text-slate-400">{p.segment}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-[12.5px] whitespace-nowrap text-slate-500">{p.nationalId}</td>
              <td className="px-4 py-3">
                <div className="text-[13px] text-slate-700">{p.city}</div>
                <div className="text-[12px] text-slate-400">{p.department}</div>
              </td>
              <td className="px-4 py-3 text-[13px] text-slate-700 tabular-nums">{p.age}</td>
              <td className="px-4 py-3 text-[13px] whitespace-nowrap text-slate-700">
                {p.employment === "Sin información" ? <span className="text-amber-600">Sin información</span> : p.employment}
              </td>
              <td className="px-4 py-3">
                <ScoreCell value={p.characterization} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={p.profileStatus} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ChannelIcon channel={p.lastInteraction.channel} className="h-6 w-6" />
                  <span className="text-[12.5px] whitespace-nowrap text-slate-500">{relativeDays(p.lastInteraction.date)}</span>
                </div>
              </td>
              <td className="py-3 pr-5">
                <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
