"use client";

import { useEffect, useMemo, useState } from "react";
import { isValidEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";

type EmojiInputProps = {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  label?: string;
  hint?: string;
  disabled?: boolean;
  /** Renderowane pod inputem; nadpisuje domyślny hint platformowy. */
  helper?: React.ReactNode;
};

function detectPlatformHint(): string {
  if (typeof navigator === "undefined") {
    return "Naciśnij ⌃⌘Space (Mac) / Win+. (Windows) — albo użyj emoji-klawiatury w telefonie.";
  }
  const ua = navigator.userAgent;
  if (/Mac|iPhone|iPad/.test(ua)) {
    return "Naciśnij ⌃⌘Space (Mac) — albo użyj emoji-klawiatury w telefonie.";
  }
  if (/Windows/.test(ua)) {
    return "Naciśnij Win + . żeby otworzyć systemowy picker emoji.";
  }
  return "Otwórz systemową klawiaturę emoji i wstaw jeden symbol.";
}

export function EmojiInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  required,
  label = "Avatar (emoji)",
  hint,
  disabled,
  helper,
}: EmojiInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = controlled ? (value ?? "") : internal;
  const [touched, setTouched] = useState(false);
  const [platformHint, setPlatformHint] = useState<string>(
    "Otwórz systemową klawiaturę emoji i wstaw jeden symbol.",
  );

  useEffect(() => {
    setPlatformHint(detectPlatformHint());
  }, []);

  const valid = useMemo(() => isValidEmoji(current), [current]);
  const showError = touched && current.length > 0 && !valid;
  const inputId = id ?? `emoji-${name}`;

  function update(next: string) {
    if (!controlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block font-body text-body-sm text-secondary"
      >
        {label}
        {required ? <span className="ml-1 text-brand-gold">*</span> : null}
      </label>
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full border text-2xl",
            valid
              ? "border-brand-gold/40 bg-brand-accent-2"
              : "border-border bg-card",
          )}
        >
          {valid ? current : <span className="text-muted">🙂</span>}
        </div>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={64}
          required={required}
          disabled={disabled}
          value={current}
          onChange={(e) => update(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="🙂"
          aria-invalid={showError || undefined}
          aria-describedby={`${inputId}-hint`}
          className={cn(
            "w-full rounded-btn border bg-background px-4 py-3 font-body text-2xl text-primary transition-colors duration-200 ease-out focus:outline-none",
            showError
              ? "border-error focus:border-error"
              : "border-[rgba(255,255,255,0.1)] focus:border-brand-gold",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      </div>
      <p
        id={`${inputId}-hint`}
        className={cn(
          "mt-2 font-body text-body-xs",
          showError ? "text-error" : "text-muted",
        )}
      >
        {showError
          ? "Wybierz dokładnie jedno emoji."
          : (helper ?? hint ?? platformHint)}
      </p>
    </div>
  );
}
