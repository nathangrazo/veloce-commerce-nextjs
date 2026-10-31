"use client";

import { CheckCircle2, Info, X, AlertCircle } from "lucide-react";
import { useToast, useToastList } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";

export function Toaster() {
  const toasts = useToastList();
  const { dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 sm:right-6 sm:bottom-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface/95 p-4 shadow-lg backdrop-blur-md transition-all",
            toast.tone === "error" && "border-danger/40",
            toast.tone === "success" && "border-emerald-500/30",
            toast.tone === "info" && "border-border"
          )}
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : toast.tone === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
            {toast.description ? (
              <p className="mt-0.5 text-xs text-muted">{toast.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-muted hover:bg-surface-subtle hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
