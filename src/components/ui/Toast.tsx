"use client";

import { CircleCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const node = message ? (
    <div className="fixed right-6 bottom-6 z-[60] flex animate-slide-up items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-[13px] font-medium text-white shadow-2xl shadow-slate-900/30">
      <CircleCheck className="h-4 w-4 text-emerald-400" />
      {message}
    </div>
  ) : null;

  return { show, node };
}
