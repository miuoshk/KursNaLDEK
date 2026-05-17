"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resendConfirmationAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

function ResendSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-btn border border-brand-gold/40 bg-brand-gold/10 px-4 py-2 font-body text-body-sm font-medium text-brand-gold transition duration-200 ease-out",
        "hover:bg-brand-gold/15 disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {pending ? "Wysyłanie..." : "Wyślij link potwierdzający ponownie"}
    </button>
  );
}

type ResendConfirmationButtonProps = {
  email: string;
};

export function ResendConfirmationButton({ email }: ResendConfirmationButtonProps) {
  const [state, formAction] = useActionState(
    resendConfirmationAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="email" value={email} />
      <ResendSubmit />
      {state.error ? (
        <p className="font-body text-body-xs text-[#F87171]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="font-body text-body-xs text-brand-gold" role="status">
          {state.info}
        </p>
      ) : null}
    </form>
  );
}
