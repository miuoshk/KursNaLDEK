import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1 className="font-heading text-heading-lg text-primary">{t("linkExpiredTitle")}</h1>
        <p className="mt-4 font-body text-body-sm text-secondary">{t("linkExpiredBody")}</p>
        <p className="mt-6 text-center font-body text-body-sm text-secondary">
          <Link
            href="/forgot-password"
            className="text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold"
          >
            {t("sendNewLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-heading-lg text-primary">{t("resetPasswordTitle")}</h1>
      <p className="mt-3 font-body text-body-sm text-secondary">
        {t("resetPasswordIntro", { email: user.email ?? "" })}
      </p>
      <ResetPasswordForm />
    </div>
  );
}
