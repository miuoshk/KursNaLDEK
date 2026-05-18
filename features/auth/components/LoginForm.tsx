"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/features/auth/actions";
import { ResendConfirmationButton } from "@/features/auth/components/ResendConfirmationButton";
import { initialAuthActionState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full rounded-btn border border-[rgba(255,255,255,0.1)] bg-background px-4 py-3 font-body text-white placeholder:text-muted transition-colors duration-200 ease-out focus:border-brand-gold focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out",
        "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70",
      )}
    >
      {pending ? "Logowanie..." : "Zaloguj się"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialAuthActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block font-body text-body-sm text-secondary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClassName}
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <label htmlFor="password" className="block font-body text-body-sm text-secondary">
            Hasło
          </label>
          <Link
            href="/forgot-password"
            className="font-body text-body-xs text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
          >
            Nie pamiętasz hasła?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClassName}
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />

      {state.error ? (
        <div className="mt-3 space-y-2">
          <p className="font-body text-body-sm text-[#F87171]" role="alert">
            {state.error}
          </p>
          {state.resendEmail ? (
            <ResendConfirmationButton email={state.resendEmail} />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
