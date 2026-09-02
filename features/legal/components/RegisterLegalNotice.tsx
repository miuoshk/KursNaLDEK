"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

const linkClassName =
  "text-brand-sage underline underline-offset-2 transition-colors duration-200 ease-out hover:text-brand-gold";

/** Wymagana zgoda na Regulamin i Politykę + klauzula informacyjna RODO pod formularzem rejestracji. */
export function RegisterLegalNotice() {
  const t = useTranslations("auth");

  return (
    <div className="space-y-3">
      <label
        htmlFor="acceptTerms"
        className="flex cursor-pointer items-start gap-3 rounded-btn border border-white/10 bg-white/[0.03] px-4 py-3"
      >
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          required
          aria-required="true"
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-gold"
        />
        <span className="font-body text-body-xs leading-relaxed text-secondary">
          {t.rich("registerLegalNotice", {
            regulaminLink: () => (
              <Link
                href={LEGAL_DOCUMENTS.regulamin.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                {t("registerLegalRegulaminLinkText")}
              </Link>
            ),
            privacyLink: () => (
              <Link
                href={LEGAL_DOCUMENTS.politykaPrywatnosci.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                {t("registerLegalPrivacyLinkText")}
              </Link>
            ),
          })}
        </span>
      </label>
      <p className="font-body text-[11px] leading-relaxed text-muted">
        {t.rich("registerGdprNotice", {
          mailLink: () => (
            <a href="mailto:info@zenitlabs.pl" className={linkClassName}>
              info@zenitlabs.pl
            </a>
          ),
        })}
      </p>
    </div>
  );
}
