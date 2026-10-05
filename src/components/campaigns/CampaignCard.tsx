"use client";

import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, PhoneCall, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { ProgressBar } from "@/components/ui/Progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AiCampaign } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/format";

export function CampaignCard({
  campaign,
  isActive = false,
  onSelect,
  onActivate,
}: {
  campaign: AiCampaign;
  isActive?: boolean;
  onSelect?: (campaign: AiCampaign) => void;
  onActivate?: (campaign: AiCampaign) => void;
}) {
  const router = useRouter();
  const completion = campaign.audience ? Math.round((campaign.completed / campaign.audience) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between min-w-0 max-w-full overflow-hidden rounded-xl border bg-white p-4 transition duration-200",
        isActive
          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-linear-to-b from-indigo-50/30 to-white shadow-md shadow-indigo-500/10"
          : "border-slate-200/70 hover:border-indigo-300 hover:shadow-[0_8px_24px_-12px_rgba(79,70,229,0.18)]"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14.5px] font-semibold text-slate-900 group-hover:text-indigo-700">
                {campaign.name}
              </span>
            </div>
            <div className="mt-0.5 line-clamp-1 text-[12.5px] text-slate-500">{campaign.objective}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge status={campaign.status} />
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10.5px] font-semibold text-white shadow-xs">
                <CheckCircle2 className="h-3 w-3" />
                En tablero
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Completados</div>
            <div className="mt-0.5 text-[15px] font-semibold text-slate-900 tabular-nums">
              {formatNumber(campaign.completed)}
              <span className="font-normal text-slate-400"> / {formatNumber(campaign.audience)}</span>
            </div>
          </div>
          <div className="text-right text-[20px] font-semibold tracking-tight text-slate-900 tabular-nums">
            {completion} %
          </div>
        </div>

        <ProgressBar value={completion} className="mt-2" barClassName="bg-linear-to-r from-indigo-500 to-cyan-500" />

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex shrink-0 gap-1">
            {campaign.channels.map((c) => (
              <ChannelBadge key={c} channel={c} compact />
            ))}
          </div>
          <span className="flex items-center gap-1 text-[11.5px] text-slate-400 sm:text-[12px]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onActivate) onActivate(campaign);
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11.5px] font-semibold transition cursor-pointer",
            isActive
              ? "bg-indigo-100/80 text-indigo-800"
              : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>{isActive ? "Activa" : "Ver en tablero"}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(campaign);
          }}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-50 py-1.5 px-2 text-[11.5px] font-semibold text-violet-700 hover:bg-violet-100 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Demo y detalle</span>
        </button>
      </div>
    </div>
  );
}
