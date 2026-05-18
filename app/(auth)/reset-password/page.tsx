import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1 className="font-heading text-heading-lg text-primary">
          Link wygasł
        </h1>
        <p className="mt-4 font-body text-body-sm text-secondary">
          Twój link do resetu hasła wygasł lub został już użyty. Poproś o nowy
          link i spróbuj ponownie.
        </p>
        <p className="mt-6 text-center font-body text-body-sm text-secondary">
          <Link
            href="/forgot-password"
            className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
          >
            Wyślij nowy link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">
        Ustaw nowe hasło
      </h1>
      <p className="mt-3 font-body text-body-sm text-secondary">
        Wpisz nowe hasło dla konta{" "}
        <span className="text-brand-gold">{user.email}</span>. Po zapisaniu
        zalogujesz się ponownie z nowym hasłem.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
