"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/features/auth/actions";
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
      {pending ? "Tworzenie konta..." : "Załóż konto"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialAuthActionState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-2 block font-body text-body-sm text-secondary">
          Imię i nazwisko
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className={inputClassName}
          placeholder="Jan Kowalski"
        />
      </div>

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
        <label htmlFor="password" className="mb-2 block font-body text-body-sm text-secondary">
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block font-body text-body-sm text-secondary">
          Powtórz hasło
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p className="font-body text-body-sm text-[#F87171]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="font-body text-body-sm text-brand-gold" role="status">
          {state.info}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
