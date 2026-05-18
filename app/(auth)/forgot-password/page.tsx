import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">
        Nie pamiętasz hasła?
      </h1>
      <ForgotPasswordForm />
      <p className="mt-6 text-center font-body text-body-sm text-secondary">
        Pamiętasz już hasło?{" "}
        <Link
          href="/login"
          className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
        >
          Wróć do logowania
        </Link>
      </p>
    </div>
  );
}
