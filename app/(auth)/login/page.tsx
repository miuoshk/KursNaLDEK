import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegistrationCountdown } from "@/features/auth/components/RegistrationCountdown";
import { isRegistrationOpen } from "@/lib/registrationWindow";

export default function LoginPage() {
  const registrationOpen = isRegistrationOpen();

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">Zaloguj się</h1>
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
