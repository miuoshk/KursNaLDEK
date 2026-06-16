"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/features/auth/types";
import { isRegistrationOpen } from "@/lib/registrationWindow";
import { isRegistrationClosedForSelection, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import {
  assertAccountNotBlocked,
  ACCOUNT_BLOCKED_MESSAGE_KEY,
  getClientIpFromHeaders,
} from "@/lib/auth/accountBan";
import { isValidEmoji } from "@/lib/emoji";
import { assertAuthRateLimit, AUTH_RATE_LIMIT_MESSAGE_KEY } from "@/lib/security/rateLimit";

const loginSchema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(6, "passwordMinLength"),
});

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "fullNameRequired")
      .max(120, "fullNameTooLong"),
    nick: z
      .string()
      .trim()
      .min(3, "nickMinLength")
      .max(32, "nickMaxLength")
      .regex(/^[A-Za-z0-9._-]+$/, "nickInvalidChars"),
    email: z.string().email("emailInvalid"),
    password: z.string().min(6, "passwordMinLength"),
    confirmPassword: z.string().min(6, "confirmPasswordRequired"),
    courseType: z
      .string()
      .refine((value): value is "knnp" | "ldek" | "ldew" => {
        return value === "knnp" || value === "ldek" || value === "ldew";
      }, { message: "courseRequired" }),
    currentTrack: z.string().nullish(),
    currentYear: z.preprocess(
      (value) => (value === null || value === undefined || value === "" ? undefined : value),
      z.coerce.number().int().optional(),
    ),
    avatarEmoji: z
      .string()
      .trim()
      .refine(isValidEmoji, "avatarEmojiInvalid"),
  })
  .superRefine((data, ctx) => {
    if (data.courseType !== "knnp") return;
    if (data.currentTrack !== "stomatologia" && data.currentTrack !== "lekarski") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "trackRequired", path: ["currentTrack"] });
    }
    if (data.currentYear === undefined || data.currentYear < 1 || data.currentYear > 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "studyYearRequired", path: ["currentYear"] });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMustMatch",
    path: ["confirmPassword"],
  });

type ErrorTranslator = Awaited<ReturnType<typeof getTranslations<"errors">>>;

function translateErrorKey(tErrors: ErrorTranslator, key: string): string {
  return tErrors(key as Parameters<ErrorTranslator>[0]);
}

type MappedRegisterError = {
  messageKey?: keyof IntlMessages["errors"];
  fallbackMessage?: string;
  offerResend: boolean;
};

function mapRegisterErrorMessage(
  message: string,
  code?: string | null,
): MappedRegisterError {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return {
      messageKey: "emailAlreadyRegistered",
      offerResend: true,
    };
  }
  if (
    normalized.includes("profiles_nick_lower_unique") ||
    (normalized.includes("duplicate key value") && normalized.includes("nick"))
  ) {
    return { messageKey: "nickTaken", offerResend: false };
  }
  if (normalized.includes("password")) {
    return {
      messageKey: "passwordSecurityRequirements",
      offerResend: false,
    };
  }
  if (normalized.includes("invalid email") || normalized.includes("email address")) {
    return { messageKey: "emailInvalid", offerResend: false };
  }
  if (
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit") ||
    code === "over_email_send_rate_limit"
  ) {
    return {
      messageKey: "emailRateLimitRegister",
      offerResend: true,
    };
  }
  return {
    messageKey: "registerFailed",
    offerResend: false,
  };
}

function mapLoginErrorMessage(
  message: string,
  code?: string | null,
): MappedRegisterError {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("email not confirmed") ||
    code === "email_not_confirmed"
  ) {
    return {
      messageKey: "emailNotConfirmed",
      offerResend: true,
    };
  }
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    code === "invalid_credentials"
  ) {
    return {
      messageKey: "invalidCredentials",
      offerResend: false,
    };
  }
  return {
    fallbackMessage: message,
    offerResend: false,
  };
}

function resolveMappedError(tErrors: ErrorTranslator, mapped: MappedRegisterError): string {
  if (mapped.messageKey) {
    return translateErrorKey(tErrors, mapped.messageKey);
  }
  return mapped.fallbackMessage ?? translateErrorKey(tErrors, "invalidLoginData");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tErrors = await getTranslations("errors");

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message ?? "invalidLoginData";
    return {
      error: translateErrorKey(tErrors, key),
      info: null,
    };
  }

  const ip = await getClientIpFromHeaders();
  const rateLimit = assertAuthRateLimit({
    action: "login",
    ip,
    email: parsed.data.email,
  });
  if (rateLimit.blocked) {
    return { error: translateErrorKey(tErrors, rateLimit.messageKey), info: null };
  }

  const { blocked } = await assertAccountNotBlocked({ email: parsed.data.email, ip });
  if (blocked) {
    return { error: translateErrorKey(tErrors, ACCOUNT_BLOCKED_MESSAGE_KEY), info: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const detailedCode = (error as { code?: string | null }).code ?? null;
    const mapped = mapLoginErrorMessage(error.message, detailedCode);
    return {
      error: resolveMappedError(tErrors, mapped),
      info: null,
      resendEmail: mapped.offerResend ? parsed.data.email : null,
    };
  }

  if (ip) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ last_login_ip: ip }).eq("id", user.id);
    }
  }

  redirect("/");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tErrors = await getTranslations("errors");
  const tAuth = await getTranslations("auth");

  if (!isRegistrationOpen()) {
    return {
      error: translateErrorKey(tErrors, "registrationTemporarilyClosed"),
      info: null,
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    nick: formData.get("nick"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    courseType: formData.get("courseType"),
    currentTrack: formData.get("currentTrack"),
    currentYear: formData.get("currentYear"),
    avatarEmoji: formData.get("avatarEmoji"),
  });

  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message ?? "invalidRegisterData";
    return {
      error: translateErrorKey(tErrors, key),
      info: null,
    };
  }

  if (parsed.data.courseType !== "knnp") {
    return {
      error: translateErrorKey(tErrors, "coursePreparing"),
      info: null,
    };
  }

  const ip = await getClientIpFromHeaders();
  const rateLimit = assertAuthRateLimit({
    action: "register",
    ip,
    email: parsed.data.email,
  });
  if (rateLimit.blocked) {
    return { error: translateErrorKey(tErrors, rateLimit.messageKey), info: null };
  }

  const track = normalizeTrack(parsed.data.currentTrack);
  const year = normalizeYear(parsed.data.currentYear);
  if (isRegistrationClosedForSelection(track, year)) {
    return {
      error: translateErrorKey(tErrors, "registrationClosedSelection"),
      info: null,
    };
  }

  const { blocked } = await assertAccountNotBlocked({ email: parsed.data.email });
  if (blocked) {
    return { error: translateErrorKey(tErrors, ACCOUNT_BLOCKED_MESSAGE_KEY), info: null };
  }

  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const trimmedEmail = parsed.data.email.trim();
  const { error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/login`,
      data: {
        full_name: parsed.data.fullName,
        nick: parsed.data.nick,
        display_name: parsed.data.nick,
        current_product: parsed.data.courseType,
        current_track: track,
        current_year: year,
        avatar_emoji: parsed.data.avatarEmoji,
      },
    },
  });

  if (error) {
    const detailedCode = (error as { code?: string | null }).code ?? null;
    console.error("[registerAction] signUp failed", {
      message: error.message,
      code: detailedCode,
      status: error.status,
      emailDomain: trimmedEmail.split("@")[1] ?? null,
    });
    const mapped = mapRegisterErrorMessage(error.message, detailedCode);
    return {
      error: resolveMappedError(tErrors, mapped),
      info: null,
      resendEmail: mapped.offerResend ? trimmedEmail : null,
    };
  }

  return {
    error: null,
    info: tAuth("infoAccountCreated"),
    resendEmail: null,
  };
}

const resendSchema = z.object({
  email: z.string().email("emailInvalid"),
});

export async function resendConfirmationAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tErrors = await getTranslations("errors");
  const tAuth = await getTranslations("auth");

  const parsed = resendSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message ?? "invalidEmail";
    return {
      error: translateErrorKey(tErrors, key),
      info: null,
      resendEmail: null,
    };
  }

  const ip = await getClientIpFromHeaders();
  const rateLimit = assertAuthRateLimit({
    action: "resend-confirmation",
    ip,
    email: parsed.data.email,
  });
  if (rateLimit.blocked) {
    return {
      error: translateErrorKey(tErrors, rateLimit.messageKey),
      info: null,
      resendEmail: parsed.data.email,
    };
  }

  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/login`,
    },
  });

  if (error) {
    const detailedCode = (error as { code?: string | null }).code ?? null;
    console.error("[resendConfirmationAction] resend failed", {
      message: error.message,
      code: detailedCode,
      status: error.status,
    });
    const normalized = error.message.toLowerCase();
    if (
      normalized.includes("email rate limit") ||
      normalized.includes("rate limit") ||
      detailedCode === "over_email_send_rate_limit"
    ) {
      return {
        error: translateErrorKey(tErrors, "emailRateLimitResend"),
        info: null,
        resendEmail: parsed.data.email,
      };
    }
    return {
      error: translateErrorKey(tErrors, "resendFailed"),
      info: null,
      resendEmail: parsed.data.email,
    };
  }

  return {
    error: null,
    info: tAuth("infoResendConfirmationSent", { email: parsed.data.email }),
    resendEmail: null,
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("emailInvalid"),
});

function mapResetEmailError(message: string, code?: string | null): keyof IntlMessages["errors"] {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("rate limit") ||
    code === "over_email_send_rate_limit"
  ) {
    return "emailRateLimitResend";
  }
  return "resendFailed";
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tErrors = await getTranslations("errors");
  const tAuth = await getTranslations("auth");

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message ?? "invalidEmail";
    return {
      error: translateErrorKey(tErrors, key),
      info: null,
      resendEmail: null,
    };
  }

  const trimmedEmail = parsed.data.email.trim();

  const ip = await getClientIpFromHeaders();
  const rateLimit = assertAuthRateLimit({
    action: "password-reset",
    ip,
    email: trimmedEmail,
  });
  if (rateLimit.blocked) {
    return { error: translateErrorKey(tErrors, rateLimit.messageKey), info: null, resendEmail: null };
  }

  const supabase = await createClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    const detailedCode = (error as { code?: string | null }).code ?? null;
    console.error("[requestPasswordResetAction] resetPasswordForEmail failed", {
      message: error.message,
      code: detailedCode,
      status: error.status,
    });
    return {
      error: translateErrorKey(tErrors, mapResetEmailError(error.message, detailedCode)),
      info: null,
      resendEmail: null,
    };
  }

  return {
    error: null,
    info: tAuth("infoPasswordResetSent", { email: trimmedEmail }),
    resendEmail: null,
  };
}

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "passwordMinLength"),
    confirmPassword: z.string().min(6, "confirmNewPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMustMatch",
    path: ["confirmPassword"],
  });

function mapUpdatePasswordError(message: string): keyof IntlMessages["errors"] {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("same as the old password") ||
    normalized.includes("new password should be different")
  ) {
    return "passwordSameAsOld";
  }
  if (normalized.includes("password") && normalized.includes("weak")) {
    return "passwordSecurityRequirements";
  }
  if (
    normalized.includes("auth session missing") ||
    normalized.includes("not authenticated")
  ) {
    return "resetLinkExpired";
  }
  return "updatePasswordFailed";
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const tErrors = await getTranslations("errors");

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const key = parsed.error.issues[0]?.message ?? "invalidData";
    return {
      error: translateErrorKey(tErrors, key),
      info: null,
      resendEmail: null,
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      error: translateErrorKey(tErrors, "resetLinkExpired"),
      info: null,
      resendEmail: null,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    const detailedCode = (error as { code?: string | null }).code ?? null;
    console.error("[updatePasswordAction] updateUser failed", {
      message: error.message,
      code: detailedCode,
      status: error.status,
    });
    return {
      error: translateErrorKey(tErrors, mapUpdatePasswordError(error.message)),
      info: null,
      resendEmail: null,
    };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}
