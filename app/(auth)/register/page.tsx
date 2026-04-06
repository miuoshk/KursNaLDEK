import Link from "next/link";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">Załóż konto</h1>
      <RegisterForm />
      <p className="mt-6 text-center font-body text-body-sm text-secondary">
        Masz już konto?{" "}
        <Link
          href="/login"
          className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
