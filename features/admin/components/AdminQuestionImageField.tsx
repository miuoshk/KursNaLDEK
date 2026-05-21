"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { uploadQuestionImage } from "@/features/admin/api/uploadQuestionImage";
import { cn } from "@/lib/utils";

type AdminQuestionImageFieldProps = {
  questionId: string;
  value: string;
  onChange: (next: string) => void;
};

export function AdminQuestionImageField({
  questionId,
  value,
  onChange,
}: AdminQuestionImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.set("questionId", questionId);
        formData.set("file", file);
        const result = await uploadQuestionImage(formData);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        onChange(result.url);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [questionId, onChange],
  );

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="font-body text-body-xs uppercase tracking-widest text-muted">
        Obraz do pytania
      </span>

      {value ? (
        <div className="overflow-hidden rounded-card border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview z Supabase Storage */}
          <img
            src={value}
            alt="Podgląd obrazu pytania"
            className="max-h-64 w-full object-contain bg-black/20"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
            <p className="min-w-0 flex-1 truncate font-body text-body-xs text-muted" title={value}>
              {value}
            </p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 rounded-btn border border-error/30 px-2 py-1 font-body text-body-xs text-error transition-colors hover:bg-error/10"
            >
              <Trash2 className="size-3" aria-hidden />
              Usuń
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-background/40 px-4 py-8 text-center">
          <ImageIcon className="size-8 text-muted" aria-hidden />
          <p className="font-body text-body-sm text-secondary">
            Brak obrazu — dodaj plik JPEG, PNG, WebP lub GIF (max 5 MB).
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "inline-flex items-center gap-2 rounded-btn border border-border bg-card px-3 py-1.5",
            "font-body text-body-sm text-secondary transition-colors hover:text-primary disabled:opacity-50",
          )}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {uploading ? "Wysyłanie…" : value ? "Zmień obraz" : "Dodaj obraz"}
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-body text-body-xs text-muted">
          Lub wklej URL ręcznie
        </span>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={cn(
            "w-full rounded-btn border border-border bg-background px-3 py-2",
            "font-body text-body-sm text-primary placeholder:text-muted",
            "focus:border-brand-sage focus:outline-none",
          )}
        />
      </label>

      {error ? (
        <p className="font-body text-body-xs text-error">{error}</p>
      ) : null}
    </div>
  );
}
