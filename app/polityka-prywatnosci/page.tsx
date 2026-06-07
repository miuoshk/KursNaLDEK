import type { Metadata } from "next";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export const metadata: Metadata = {
  title: "Polityka prywatności i cookies — Kurs na LDEK",
};

export default function PolitykaPrywatnosciPage() {
  const doc = LEGAL_DOCUMENTS.politykaPrywatnosci;
  return <LegalDocumentPage title={doc.title} pdfPath={doc.pdfPath} />;
}
