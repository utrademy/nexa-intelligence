import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { ProgressBar } from "@/components/ui/Progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AiCampaign } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";

export function CampaignCard({ campaign }: { campaign: AiCampaign }) {
  const completion = campaign.audience ? Math.round((campaign.completed / campaign.audience) * 100) : 0;
  return (
    <Link
      href="/campaigns"
      className="group block min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-slate-900 group-hover:text-indigo-700">{campaign.name}</div>
          <div className="mt-0.5 line-clamp-1 text-[12.5px] text-slate-500">{campaign.objective}</div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Completados</div>
          <div className="mt-0.5 text-[15px] font-semibold text-slate-900 tabular-nums">
            {formatNumber(campaign.completed)}
            <span className="font-normal text-slate-400"> / {formatNumber(campaign.audience)}</span>
          </div>
        </div>
        <div className="text-right text-[20px] font-semibold tracking-tight text-slate-900 tabular-nums">{completion} %</div>
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
          <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
        </span>
      </div>
    </Link>
  );
}
