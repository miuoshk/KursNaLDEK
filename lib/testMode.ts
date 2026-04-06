import { createHmac } from "node:crypto";

/** Konto tylko do trybu testowego — omija Supabase Auth (bez sesji JWT Supabase). */
export const TEST_MODE_EMAIL = "test2137@gmd.pl";
export const TEST_MODE_LOGIN_PASSWORD = "test21371234";

export const TEST_MODE_COOKIE_NAME = "kurs_test_mode";

function signingSecret(): string {
  return process.env.TEST_MODE_SECRET ?? "kurs-dev-test-mode-secret-zmien-w-produkcji";
}

/** Wartość ciasteczka weryfikowana w proxy i layoutcie. */
export function getTestModeCookieValue(): string {
  return createHmac("sha256", signingSecret())
    .update(`TEST_MODE_V1:${TEST_MODE_EMAIL}`)
    .digest("hex");
}

export function isTestModeCredentials(email: string, password: string): boolean {
  if (process.env.TEST_MODE_LOGIN_ENABLED === "false") return false;
  return email === TEST_MODE_EMAIL && password === TEST_MODE_LOGIN_PASSWORD;
}

export function isTestModeCookie(value: string | undefined): boolean {
  if (!value) return false;
  return value === getTestModeCookieValue();
}
