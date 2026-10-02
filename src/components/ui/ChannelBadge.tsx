import { Building2, FileText, MessageCircle, MessageSquareText, PhoneCall, Smartphone } from "lucide-react";
import { CHANNEL_LABEL, cn } from "@/lib/format";

const CONFIG = {
  voice: { icon: PhoneCall, className: "text-violet-600 bg-violet-50 ring-violet-600/15" },
  whatsapp: { icon: MessageCircle, className: "text-emerald-600 bg-emerald-50 ring-emerald-600/15" },
  sms: { icon: MessageSquareText, className: "text-amber-600 bg-amber-50 ring-amber-600/15" },
  form: { icon: FileText, className: "text-sky-600 bg-sky-50 ring-sky-600/15" },
  branch: { icon: Building2, className: "text-slate-600 bg-slate-100 ring-slate-500/15" },
  app: { icon: Smartphone, className: "text-indigo-600 bg-indigo-50 ring-indigo-600/15" },
};

export type ChannelKey = keyof typeof CONFIG;

export function ChannelIcon({ channel, className }: { channel: ChannelKey; className?: string }) {
  const { icon: Icon, className: tone } = CONFIG[channel];
  return (
    <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", tone, className)}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export function ChannelBadge({ channel, compact }: { channel: ChannelKey; compact?: boolean }) {
  const { icon: Icon, className } = CONFIG[channel];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset", className)}>
      <Icon className="h-3 w-3" />
      {!compact && CHANNEL_LABEL[channel]}
    </span>
  );
}
