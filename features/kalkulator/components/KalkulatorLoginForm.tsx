"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import { cn } from "@/lib/utils";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  link_invalid: "Link logowania jest nieprawidłowy. Wyślij nowy.",
  link_expired: "Link wygasł. Wyślij nowy link logowania.",
};

const inputClassName =
  "w-full rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-white px-4 py-3 font-body text-[color:var(--k-text)] placeholder:text-[color:var(--k-muted)] transition focus:border-[color:var(--k-accent)] focus:outline-none";

export function KalkulatorLoginForm() {
  const searchParams = useSearchParams();
  const authErrorKey = searchParams.get("auth_error");
  const authErrorMessage = authErrorKey ? AUTH_ERROR_MESSAGES[authErrorKey] : null;

  const supabase = useMemo(() => createKalkulatorClient(), []);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const redirectTo = `${window.location.origin}/kalkulator/auth/callback?next=/kalkulator`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setPending(false);

    if (otpError) {
      setError("Nie udało się wysłać linku. Sprawdź adres e-mail i spróbuj ponownie.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-8 shadow-sm">
        <h1 className="font-heading text-2xl text-[color:var(--k-primary)]">
          Sprawdź skrzynkę
        </h1>
        <p className="mt-3 font-body text-sm text-[color:var(--k-muted)]">
          Wysłaliśmy link logowania na{" "}
          <span className="font-medium text-[color:var(--k-text)]">{email.trim()}</span>.
          Kliknij link w wiadomości, aby wejść do kalkulatora.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="mt-6 font-body text-sm text-[color:var(--k-primary-light)] underline-offset-2 hover:underline"
        >
          Użyj innego adresu
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-8 shadow-sm">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]">
        kursnaldek.pl
      </p>
      <h1 className="mt-2 font-heading text-2xl text-[color:var(--k-primary)]">
        Kalkulator kosztów procedur
      </h1>
      <p className="mt-3 font-body text-sm text-[color:var(--k-muted)]">
        Podaj e-mail gabinetu. Wyślemy link logowania — bez hasła.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="kalkulator-email"
            className="mb-2 block font-body text-sm text-[color:var(--k-text)]"
          >
            E-mail
          </label>
          <input
            id="kalkulator-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            placeholder="gabinet@example.pl"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "w-full rounded-[var(--k-radius-btn)] bg-[color:var(--k-accent)] px-6 py-3 font-body text-sm font-semibold text-[color:var(--k-text)] transition",
            "hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70",
          )}
        >
          {pending ? "Wysyłanie…" : "Wyślij link"}
        </button>

        {error || authErrorMessage ? (
          <p className="font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
            {error ?? authErrorMessage}
          </p>
        ) : null}
      </form>
    </div>
  );
}
