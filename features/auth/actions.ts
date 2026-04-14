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

const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail."),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Podaj imię i nazwisko."),
    email: z.string().email("Podaj poprawny adres e-mail."),
    password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
    confirmPassword: z.string().min(6, "Powtórz hasło."),
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
    /* Tymczasowo: pełny komunikat Supabase do debugowania (usuń przed produkcją). */
    return { error: error.message, info: null };
  }

  redirect("/");
}

function mapRegisterErrorMessage(
  message: string,
  code?: string | null,
): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Ten adres e-mail jest już zajęty.";
  }
  if (normalized.includes("password")) {
    return "Hasło nie spełnia wymagań bezpieczeństwa.";
  }
  if (normalized.includes("invalid email") || normalized.includes("email address")) {
    return "Podaj poprawny adres e-mail.";
  }
  if (normalized.includes("rate limit") || code === "over_email_send_rate_limit") {
    return "Za dużo prób rejestracji. Spróbuj ponownie za chwilę.";
  }
  return "Nie udało się założyć konta. Spróbuj ponownie.";
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
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
        display_name: parsed.data.fullName,
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
    return {
      error: `${mapRegisterErrorMessage(error.message, detailedCode)} (debug: ${detailedCode ?? "brak_kodu"})`,
      info: null,
    };
  }

  return {
    error: null,
    info:
      "Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, a następnie zaloguj się.",
  };
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(TEST_MODE_COOKIE_NAME);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
