import Link from "next/link";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export function LegalFooterLinks() {
  return (
    <footer className="border-t border-white/10 pt-6 text-center">
      <p className="font-body text-xs text-muted">
        <Link
          href={LEGAL_DOCUMENTS.regulamin.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition hover:text-secondary"
        >
          Regulamin
        </Link>
        <span className="mx-2 text-white/20">·</span>
        <Link
          href={LEGAL_DOCUMENTS.politykaPrywatnosci.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition hover:text-secondary"
        >
          Polityka prywatności i cookies
        </Link>
      </p>
    </footer>
  );
}
