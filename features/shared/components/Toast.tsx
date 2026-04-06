"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type ToastItemProps = {
  id: string;
  message: string;
  variant: ToastVariant;
  onDismiss: (id: string) => void;
};

export function ToastItem({ id, message, variant, onDismiss }: ToastItemProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex max-w-sm items-start gap-3 rounded-card border px-4 py-3 shadow-lg",
        "border-[rgba(255,255,255,0.1)] bg-brand-card-2",
        variant === "success" && "border-success/30",
        variant === "error" && "border-error/30",
        variant === "info" && "border-brand-sage/30",
      )}
    >
      <p className="flex-1 font-body text-body-sm text-primary">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-btn p-1 text-muted transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
        aria-label="Zamknij"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
