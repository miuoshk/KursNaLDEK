import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { isRegistrationOpen } from "@/lib/registrationWindow";

export default async function RegisterPage() {
  if (!isRegistrationOpen()) {
    redirect("/login");
  }

  const t = await getTranslations("auth");

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">{t("register")}</h1>
      <RegisterForm />
      <p className="mt-6 text-center font-body text-body-sm text-secondary">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
