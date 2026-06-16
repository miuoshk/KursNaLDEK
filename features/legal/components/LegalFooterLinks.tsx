import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export async function LegalFooterLinks() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-white/10 pt-6 text-center">
      <p className="font-body text-xs text-muted">
        <Link
          href={LEGAL_DOCUMENTS.regulamin.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition hover:text-secondary"
        >
          {t("legalRegulamin")}
        </Link>
        <span className="mx-2 text-white/20">·</span>
        <Link
          href={LEGAL_DOCUMENTS.politykaPrywatnosci.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition hover:text-secondary"
        >
          {t("legalPrivacyPolicy")}
        </Link>
      </p>
    </footer>
  );
}
