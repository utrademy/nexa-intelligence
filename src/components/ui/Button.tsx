import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "ai";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ai: "text-white bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] hover:bg-[position:100%_0] shadow-[0_6px_20px_-6px_rgba(99,102,241,0.6)] transition-[background-position,box-shadow] duration-500",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
