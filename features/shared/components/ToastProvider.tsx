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
import { ToastItem, type ToastVariant } from "@/features/shared/components/Toast";

type ToastCtx = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

type Item = { id: string; message: string; variant: ToastVariant };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now());
      setItems((prev) => [...prev, { id, message, variant }]);
      const t = setTimeout(() => dismiss(id), 3000);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem
              id={item.id}
              message={item.message}
              variant={item.variant}
              onDismiss={dismiss}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
