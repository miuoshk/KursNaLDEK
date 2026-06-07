import Link from "next/link";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export function RegisterLegalNotice() {
  return (
    <p className="font-body text-xs leading-relaxed text-muted">
      Klikając „Załóż konto”, akceptujesz{" "}
      <Link
        href={LEGAL_DOCUMENTS.regulamin.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-sage underline underline-offset-2 hover:text-brand-gold"
      >
        Regulamin
      </Link>{" "}
      oraz{" "}
      <Link
        href={LEGAL_DOCUMENTS.politykaPrywatnosci.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-sage underline underline-offset-2 hover:text-brand-gold"
      >
        Politykę prywatności i cookies
      </Link>
      .
    </p>
  );
}
