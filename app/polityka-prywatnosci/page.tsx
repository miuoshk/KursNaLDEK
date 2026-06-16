import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: `${t("legalPrivacyPolicy")} — ${t("appName")}`,
  };
}

export default async function PolitykaPrywatnosciPage() {
  const t = await getTranslations("common");
  const doc = LEGAL_DOCUMENTS.politykaPrywatnosci;
  return (
    <LegalDocumentPage title={t("legalPrivacyPolicy")} pdfPath={doc.pdfPath} />
  );
}
