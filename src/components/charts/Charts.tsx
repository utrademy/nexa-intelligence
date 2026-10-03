"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { useId } from "react";
import { formatCompact, formatNumber } from "@/lib/format";

export interface Series {
  key: string;
  name: string;
  color: string;
}

const AXIS = { fontSize: 12, fill: "#94a3b8" };

function formatValue(value: unknown, unit?: string) {
  if (typeof value !== "number") return String(value ?? "");
  return unit === "%" ? `${formatNumber(value)} %` : formatNumber(value);
}

function ChartTooltip({ active, payload, label, unit }: TooltipContentProps & { unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[150px] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur">
      {label !== undefined && <div className="mb-1.5 text-[12px] font-semibold text-slate-900">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? (entry.payload as { color?: string })?.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">{formatValue(entry.value, unit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ items }: { items: { name: string; color: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <div key={i.name} className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.name}
          {i.value && <span className="font-semibold text-slate-700">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  height = 220,
}: {
  data: { name: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  height?: number;
}) {
  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Tooltip content={(p) => <ChartTooltip {...p} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="94%" paddingAngle={2} stroke="none" cornerRadius={6}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{centerValue}</span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
}

export function BarSeriesChart({
  data,
  xKey,
  series,
  height = 240,
  horizontal = false,
  unit,
  stacked = false,
  barSize,
}: {
  data: object[];
  xKey: string;
  series: Series[];
  height?: number;
  horizontal?: boolean;
  unit?: string;
  stacked?: boolean;
  barSize?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div style={{ height }} className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, left: horizontal ? 8 : -12, bottom: 0 }} barGap={4}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`bar-${uid}-${s.key}`} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
                <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#eef2f7" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => (unit === "%" ? `${v} %` : formatCompact(v))} />
              <YAxis type="category" dataKey={xKey} tick={{ ...AXIS, fill: "#475569" }} axisLine={false} tickLine={false} width={108} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => (unit === "%" ? `${v} %` : formatCompact(v))} />
            </>
          )}
          <Tooltip cursor={{ fill: "rgba(99,102,241,0.05)" }} content={(p) => <ChartTooltip {...p} unit={unit} />} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={`url(#bar-${uid}-${s.key})`}
              radius={stacked && i < series.length - 1 ? 0 : horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              barSize={barSize}
              maxBarSize={horizontal ? 16 : 36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaSeriesChart({
  data,
  xKey,
  series,
  height = 260,
  unit,
  domain,
}: {
  data: object[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
  domain?: [number, number];
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div style={{ height }} className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={domain} tickFormatter={(v: number) => (unit === "%" ? `${v} %` : formatCompact(v))} />
          <Tooltip cursor={{ stroke: "#c7d2fe", strokeDasharray: "4 4" }} content={(p) => <ChartTooltip {...p} unit={unit} />} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.25}
              fill={`url(#area-${uid}-${s.key})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineSeriesChart({
  data,
  xKey,
  series,
  height = 240,
  unit,
  domain,
}: {
  data: object[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
  domain?: [number, number];
}) {
  return (
    <div style={{ height }} className="w-full min-w-0 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={domain} tickFormatter={(v: number) => (unit === "%" ? `${v} %` : formatCompact(v))} />
          <Tooltip cursor={{ stroke: "#c7d2fe", strokeDasharray: "4 4" }} content={(p) => <ChartTooltip {...p} unit={unit} />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.25}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
