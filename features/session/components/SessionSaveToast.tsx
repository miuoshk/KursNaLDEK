"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function SessionSaveToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-card border border-error/40 bg-card px-4 py-3 font-body text-body-sm text-primary shadow-lg",
      )}
    >
      {message}
    </div>
  );
}
