import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">{t("forgotPassword")}</h1>
      <ForgotPasswordForm />
      <p className="mt-6 text-center font-body text-body-sm text-secondary">
        {t("rememberPassword")}{" "}
        <Link
          href="/login"
          className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
