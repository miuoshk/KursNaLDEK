import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthFrame } from "@/features/auth/components/AuthFrame";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthFrame title={t("forgotPassword")}>
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
    </AuthFrame>
  );
}
