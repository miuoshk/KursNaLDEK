import type { Metadata } from "next";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export const metadata: Metadata = {
  title: "Regulamin — Kurs na LDEK",
};

export default function RegulaminPage() {
  const doc = LEGAL_DOCUMENTS.regulamin;
  return <LegalDocumentPage title={doc.title} pdfPath={doc.pdfPath} />;
}
