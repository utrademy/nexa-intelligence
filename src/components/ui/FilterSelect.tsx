"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const active = value !== "";
  return (
    <label
      className={cn(
        "relative inline-flex h-9 items-center rounded-lg border text-[13px] transition",
        active ? "border-indigo-200 bg-indigo-50/70 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full cursor-pointer appearance-none bg-transparent pr-8 pl-3 font-medium focus:outline-none"
        aria-label={label}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 opacity-60" />
    </label>
  );
}
