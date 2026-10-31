import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "accent" | "success" | "outline";
  className?: string;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-surface-subtle text-foreground border border-border",
  accent: "bg-accent text-accent-foreground",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  outline: "bg-transparent text-muted border border-border",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
