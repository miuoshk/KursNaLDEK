"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { registerAction } from "@/features/auth/actions";
import { ResendConfirmationButton } from "@/features/auth/components/ResendConfirmationButton";
import { initialAuthActionState } from "@/features/auth/types";
import { isRegistrationClosedForSelection } from "@/features/access/lib/studyAccess";
import { EmojiInput } from "@/features/shared/components/EmojiInput";
import { RegisterLegalNotice } from "@/features/legal/components/RegisterLegalNotice";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full rounded-btn border border-[rgba(255,255,255,0.1)] bg-background px-4 py-3 font-body text-white placeholder:text-muted transition-colors duration-200 ease-out focus:border-brand-gold focus:outline-none";
const selectClassName =
  "w-full rounded-btn border border-[rgba(255,255,255,0.1)] bg-background px-4 py-3 font-body text-white transition-colors duration-200 ease-out focus:border-brand-gold focus:outline-none";

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
      {pending ? t("registerPending") : t("register")}
    </button>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [state, formAction] = useActionState(registerAction, initialAuthActionState);
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [currentTrack, setCurrentTrack] = useState<"" | "stomatologia" | "lekarski">("");
  const lekYear2Closed =
    currentTrack === "lekarski" && isRegistrationClosedForSelection("lekarski", 2);
  const lekYear3Closed =
    currentTrack === "lekarski" && isRegistrationClosedForSelection("lekarski", 3);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-2 block font-body text-body-sm text-secondary">
          {t("fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className={inputClassName}
          placeholder={t("fullNamePlaceholder")}
        />
      </div>

      <EmojiInput
        name="avatarEmoji"
        required
        value={avatarEmoji}
        onChange={setAvatarEmoji}
        label={t("avatarLabel")}
        helper={t("avatarHelper")}
      />

      <div>
        <label htmlFor="nick" className="mb-2 block font-body text-body-sm text-secondary">
          {t("nick")}
        </label>
        <input
          id="nick"
          name="nick"
          type="text"
          required
          autoComplete="nickname"
          className={inputClassName}
          placeholder={t("nickPlaceholder")}
        />
        <p className="mt-1 font-body text-body-xs text-muted">
          {t("nickHelper")}
        </p>
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block font-body text-body-sm text-secondary">
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

      <div>
        <label htmlFor="password" className="mb-2 block font-body text-body-sm text-secondary">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder={tCommon("passwordPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block font-body text-body-sm text-secondary">
          {t("confirmPassword")}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder={tCommon("passwordPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="currentTrack" className="mb-2 block font-body text-body-sm text-secondary">
          {t("track")}
        </label>
        <select
          id="currentTrack"
          name="currentTrack"
          required
          className={selectClassName}
          defaultValue=""
          onChange={(event) => setCurrentTrack(event.target.value as "" | "stomatologia" | "lekarski")}
        >
          <option value="" disabled>
            {t("trackPlaceholder")}
          </option>
          <option value="stomatologia">{t("trackStomatologia")}</option>
          <option value="lekarski">{t("trackLekarski")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="currentYear" className="mb-2 block font-body text-body-sm text-secondary">
          {t("studyYear")}
        </label>
        <select id="currentYear" name="currentYear" required className={selectClassName} defaultValue="">
          <option value="" disabled>
            {t("studyYearPlaceholder")}
          </option>
          <option value="1">1</option>
          <option value="2" disabled={lekYear2Closed}>
            2
          </option>
          <option value="3" disabled={lekYear3Closed}>
            3
          </option>
        </select>
        {lekYear2Closed || lekYear3Closed ? (
          <p className="mt-1 font-body text-body-xs text-muted">{t("registrationClosed")}</p>
        ) : null}
      </div>

      {state.error ? (
        <div className="space-y-2">
          <p className="font-body text-body-sm text-[#F87171]" role="alert">
            {state.error}
          </p>
          {state.resendEmail ? (
            <ResendConfirmationButton email={state.resendEmail} />
          ) : null}
        </div>
      ) : null}
      {state.info ? (
        <p className="font-body text-body-sm text-brand-gold" role="status">
          {state.info}
        </p>
      ) : null}

      <RegisterLegalNotice />
      <SubmitButton />
    </form>
  );
}
