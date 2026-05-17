"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/features/auth/types";
import {
  getTestModeCookieValue,
  isTestModeCredentials,
  TEST_MODE_COOKIE_NAME,
  TEST_MODE_EMAIL,
} from "@/lib/testMode";
import { isRegistrationOpen } from "@/lib/registrationWindow";

const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail."),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
});

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Podaj imię i nazwisko.")
      .max(120, "Imię i nazwisko jest za długie."),
    nick: z
      .string()
      .trim()
      .min(3, "Nick musi mieć co najmniej 3 znaki.")
      .max(32, "Nick może mieć maksymalnie 32 znaki.")
      .regex(
        /^[A-Za-z0-9._-]+$/,
        "Nick może zawierać tylko litery, cyfry oraz znaki . _ -",
      ),
    email: z.string().email("Podaj poprawny adres e-mail."),
    password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
    confirmPassword: z.string().min(6, "Powtórz hasło."),
    currentTrack: z
      .string()
      .refine((value): value is "stomatologia" | "lekarski" => {
        return value === "stomatologia" || value === "lekarski";
      }, { message: "Wybierz kierunek studiów." }),
    currentYear: z.coerce.number().int().min(1, "Wybierz rok studiów.").max(3, "Wybierz rok studiów."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"],
  });

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane logowania.",
      info: null,
    };
  }

  if (isTestModeCredentials(parsed.data.email, parsed.data.password)) {
    const jar = await cookies();
    jar.set(TEST_MODE_COOKIE_NAME, getTestModeCookieValue(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      secure: process.env.NODE_ENV === "production",
    });
    redirect("/");
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
      error: mapped.message,
      info: null,
      resendEmail: mapped.offerResend ? parsed.data.email : null,
    };
  }

  redirect("/");
}

type MappedRegisterError = {
  message: string;
  /** Gdy true, formularz pokaże przycisk "Wyślij ponownie link potwierdzający". */
  offerResend: boolean;
};

function mapRegisterErrorMessage(
  message: string,
  code?: string | null,
): MappedRegisterError {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return {
      message:
        "Ten adres e-mail jest już zajęty. Jeśli to Ty, sprawdź skrzynkę (i spam) — być może masz już link aktywacyjny. Jeśli wygasł, kliknij poniżej, żeby wysłać nowy.",
      offerResend: true,
    };
  }
  if (
    normalized.includes("profiles_nick_lower_unique") ||
    (normalized.includes("duplicate key value") && normalized.includes("nick"))
  ) {
    return { message: "Ten nick jest już zajęty.", offerResend: false };
  }
  if (normalized.includes("password")) {
    return {
      message: "Hasło nie spełnia wymagań bezpieczeństwa.",
      offerResend: false,
    };
  }
  if (normalized.includes("invalid email") || normalized.includes("email address")) {
    return { message: "Podaj poprawny adres e-mail.", offerResend: false };
  }
  if (
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit") ||
    code === "over_email_send_rate_limit"
  ) {
    return {
      message:
        "Chwilowo wyczerpaliśmy limit wysyłki maili (ten sam adres mógł już dostać link). Sprawdź skrzynkę i spam — jeśli link nie dotarł, kliknij poniżej, żeby spróbować ponownie za moment.",
      offerResend: true,
    };
  }
  return {
    message: "Nie udało się założyć konta. Spróbuj ponownie.",
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
      message:
        "Twój adres e-mail nie został jeszcze potwierdzony. Sprawdź skrzynkę (i spam). Jeśli link nie dotarł, wyślij go ponownie.",
      offerResend: true,
    };
  }
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    code === "invalid_credentials"
  ) {
    return {
      message: "Niepoprawny e-mail lub hasło.",
      offerResend: false,
    };
  }
  return {
    message,
    offerResend: false,
  };
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isRegistrationOpen()) {
    return {
      error: "Rejestracja jest tymczasowo wyłączona do 17 maja 2026, godz. 21:00.",
      info: null,
    };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    nick: formData.get("nick"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    currentTrack: formData.get("currentTrack"),
    currentYear: formData.get("currentYear"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane rejestracji.",
      info: null,
    };
  }

  if (parsed.data.email.toLowerCase() === TEST_MODE_EMAIL.toLowerCase()) {
    return { error: "Ten adres e-mail jest zarezerwowany do trybu testowego.", info: null };
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
        current_track: parsed.data.currentTrack,
        current_year: parsed.data.currentYear,
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
      error: mapped.message,
      info: null,
      resendEmail: mapped.offerResend ? trimmedEmail : null,
    };
  }

  return {
    error: null,
    info:
      "Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, a następnie zaloguj się.",
    resendEmail: null,
  };
}

const resendSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail."),
});

/**
 * Wysyła ponownie link potwierdzający rejestrację. Używane gdy użytkownik
 * widzi błąd "e-mail już zajęty" (niepotwierdzony) albo "email not
 * confirmed" przy logowaniu, oraz gdy domyślny mail rejestracyjny się
 * zgubił. Wewnętrznie wywołuje `supabase.auth.resend({ type: 'signup' })`
 * — Supabase debouncuje to po stronie Auth (`signup_confirmation.period`),
 * więc bezpieczne do wystawienia bez własnego rate-limitu.
 */
export async function resendConfirmationAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resendSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nieprawidłowy adres e-mail.",
      info: null,
      resendEmail: null,
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
        error:
          "Chwilowo wyczerpaliśmy limit wysyłki maili — spróbuj ponownie za kilka minut.",
        info: null,
        resendEmail: parsed.data.email,
      };
    }
    return {
      error: "Nie udało się wysłać linku. Spróbuj ponownie za chwilę.",
      info: null,
      resendEmail: parsed.data.email,
    };
  }

  return {
    error: null,
    info: `Wysłaliśmy nowy link potwierdzający na ${parsed.data.email}. Sprawdź skrzynkę (i spam).`,
    resendEmail: null,
  };
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(TEST_MODE_COOKIE_NAME);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
