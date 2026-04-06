"use server";

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
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane logowania." };
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
    return { error: "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie." };
  }

  redirect("/");
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
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane rejestracji." };
  }

  if (parsed.data.email.toLowerCase() === TEST_MODE_EMAIL.toLowerCase()) {
    return { error: "Ten adres e-mail jest zarezerwowany do trybu testowego." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return { error: "Nie udało się założyć konta. Spróbuj ponownie." };
  }

  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(TEST_MODE_COOKIE_NAME);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
