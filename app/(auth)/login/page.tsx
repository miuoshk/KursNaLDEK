import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegistrationCountdown } from "@/features/auth/components/RegistrationCountdown";
import { isRegistrationOpen } from "@/lib/registrationWindow";

type LoginPageProps = {
  searchParams: Promise<{
    reset?: string;
    auth_error?: string;
  }>;
};

function authErrorMessage(code: string | undefined): string | null {
  if (code === "link_invalid") {
    return "Ten link jest nieprawidłowy. Poproś o nowy link do resetu hasła.";
  }
  if (code === "link_expired") {
    return "Link do resetu hasła wygasł. Poproś o nowy i spróbuj ponownie.";
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const registrationOpen = isRegistrationOpen();
  const sp = await searchParams;
  const resetSuccess = sp.reset === "success";
  const authError = authErrorMessage(sp.auth_error);

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">Zaloguj się</h1>

      {resetSuccess ? (
        <div
          role="status"
          className="mt-4 rounded-btn border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 font-body text-body-sm text-brand-gold"
        >
          Hasło zostało zmienione. Zaloguj się nowym hasłem.
        </div>
      ) : null}

      {authError ? (
        <div
          role="alert"
          className="mt-4 rounded-btn border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 font-body text-body-sm text-[#F87171]"
        >
          {authError}
        </div>
      ) : null}

      <LoginForm />
      {registrationOpen ? (
        <p className="mt-6 text-center font-body text-body-sm text-secondary">
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
          >
            Zarejestruj się
          </Link>
        </p>
      ) : (
        <RegistrationCountdown />
      )}
    </div>
  );
}
