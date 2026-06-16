"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export function RegisterLegalNotice() {
  const t = useTranslations("auth");

  return (
    <p className="font-body text-xs leading-relaxed text-muted">
      {t.rich("registerLegalNotice", {
        regulaminLink: () => (
          <Link
            href={LEGAL_DOCUMENTS.regulamin.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-sage underline underline-offset-2 hover:text-brand-gold"
          >
            {t("registerLegalRegulaminLinkText")}
          </Link>
        ),
        privacyLink: () => (
          <Link
            href={LEGAL_DOCUMENTS.politykaPrywatnosci.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-sage underline underline-offset-2 hover:text-brand-gold"
          >
            {t("registerLegalPrivacyLinkText")}
          </Link>
        ),
      })}
    </p>
  );
}
