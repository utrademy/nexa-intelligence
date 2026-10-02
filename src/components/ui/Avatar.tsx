import { cn, initials } from "@/lib/format";
import { hashString } from "@/lib/mock/random";

const PALETTES = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const palette = PALETTES[hashString(name) % PALETTES.length];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white ring-2 ring-white",
        palette,
        size === "sm" && "h-7 w-7 text-[11px]",
        size === "md" && "h-9 w-9 text-[13px]",
        size === "lg" && "h-12 w-12 text-base",
        size === "xl" && "h-20 w-20 text-2xl",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
