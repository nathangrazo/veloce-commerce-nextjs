"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastDispatchValue {
  notify: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastStateContext = createContext<ToastItem[] | null>(null);
const ToastDispatchContext = createContext<ToastDispatchValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      counterRef.current += 1;
      const id = `toast_${Date.now()}_${counterRef.current}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);

      window.setTimeout(() => {
        dismiss(id);
      }, 3600);
    },
    [dismiss]
  );

  const dispatchValue = useMemo<ToastDispatchValue>(
    () => ({ notify, dismiss }),
    [notify, dismiss]
  );

  return (
    <ToastStateContext.Provider value={toasts}>
      <ToastDispatchContext.Provider value={dispatchValue}>
        {children}
      </ToastDispatchContext.Provider>
    </ToastStateContext.Provider>
  );
}

export function useToastList(): ToastItem[] {
  const ctx = useContext(ToastStateContext);
  if (!ctx) {
    throw new Error("useToastList must be used within a ToastProvider.");
  }
  return ctx;
}

export function useToast(): ToastDispatchValue {
  const ctx = useContext(ToastDispatchContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return ctx;
}
