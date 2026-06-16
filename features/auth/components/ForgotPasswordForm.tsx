"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/types";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full rounded-btn border border-[rgba(255,255,255,0.1)] bg-background px-4 py-3 font-body text-white placeholder:text-muted transition-colors duration-200 ease-out focus:border-brand-gold focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 ease-out",
        "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70",
      )}
    >
      {pending ? t("sendPending") : t("sendResetLink")}
    </button>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <p className="font-body text-body-sm text-secondary">
        {t("forgotPasswordDescription")}
      </p>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-body text-body-sm text-secondary"
        >
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClassName}
          placeholder={tCommon("emailPlaceholder")}
        />
      </div>

      <SubmitButton />

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
    </form>
  );
}
