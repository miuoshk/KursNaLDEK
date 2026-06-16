import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegistrationCountdown } from "@/features/auth/components/RegistrationCountdown";
import { isRegistrationOpen } from "@/lib/registrationWindow";

type LoginPageProps = {
  searchParams: Promise<{
    reset?: string;
    auth_error?: string;
    blocked?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const tAuth = await getTranslations("auth");
  const tErrors = await getTranslations("errors");
  const registrationOpen = isRegistrationOpen();
  const sp = await searchParams;
  const resetSuccess = sp.reset === "success";
  const authErrorCode = sp.auth_error;
  const accountBlocked = sp.blocked === "1";

  const authError =
    authErrorCode === "link_invalid"
      ? tErrors("linkInvalid")
      : authErrorCode === "link_expired"
        ? tErrors("linkExpired")
        : null;

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">{tAuth("login")}</h1>

      {accountBlocked ? (
        <div
          role="alert"
          className="mt-4 rounded-btn border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-3 font-body text-body-sm text-[#F87171]"
        >
          {tErrors("accountBlocked")}
        </div>
      ) : null}

      {resetSuccess ? (
        <div
          role="status"
          className="mt-4 rounded-btn border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 font-body text-body-sm text-brand-gold"
        >
          {tAuth("passwordChangedLogin")}
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
          {tAuth("noAccount")}{" "}
          <Link
            href="/register"
            className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
          >
            {tAuth("registerLink")}
          </Link>
        </p>
      ) : (
        <RegistrationCountdown />
      )}
    </div>
  );
}
